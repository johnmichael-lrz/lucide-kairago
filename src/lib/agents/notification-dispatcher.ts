import type { AgentState } from './state'
import { supabaseAdmin } from '@/lib/rag/supabase-client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mem0Client: any = null

async function getMem0Client() {
  if (!process.env.MEM0_API_KEY) return null
  if (!mem0Client) {
    const { default: MemoryClient } = await import('mem0ai')
    mem0Client = new MemoryClient({ apiKey: process.env.MEM0_API_KEY })
  }
  return mem0Client
}

function buildSmsVersion(riskLevel: string, recommendedAction: string): string {
  return `[KAIRAGO] ${riskLevel}: ${recommendedAction}`.slice(0, 160)
}

export async function notificationDispatcherNode(
  state: AgentState,
): Promise<Partial<AgentState>> {
  const { barangay_name, bulletin_draft } = state

  const risk_level = (bulletin_draft.risk_level as string) ?? 'SAFE'
  const bulletin_text = (bulletin_draft.bulletin_text as string) ?? ''
  const recommended_action = (bulletin_draft.recommended_action as string) ?? ''
  const confidence = (bulletin_draft.confidence as string) ?? 'LOW'
  const timestamp = new Date().toISOString()

  const sms_version = buildSmsVersion(risk_level, recommended_action)

  // Look up barangay_id for the FK
  let barangay_id: string | null = null
  try {
    const { data } = await supabaseAdmin
      .from('barangay_profiles')
      .select('id')
      .ilike('name', `%${barangay_name}%`)
      .limit(1)
    barangay_id = data?.[0]?.id ?? null
  } catch {
    // Non-fatal — insert with null FK
  }

  // Store bulletin in history
  try {
    await supabaseAdmin.from('bulletin_history').insert({
      barangay_id,
      barangay_name,
      risk_level,
      bulletin_text,
      recommended_action,
      confidence,
      sms_version,
      timestamp,
    })
  } catch (err) {
    console.error('Failed to store bulletin_history:', err)
  }

  // Save Mem0 memory for future agent runs
  try {
    const client = await getMem0Client()
    if (client) {
      await client.add(
        [
          {
            role: 'assistant',
            content: `${barangay_name} bulletin on ${timestamp}: risk_level=${risk_level}, confidence=${confidence}`,
          },
        ],
        { user_id: barangay_name },
      )
    }
  } catch {
    // Non-fatal
  }

  const approved_bulletin: Record<string, unknown> = {
    ...bulletin_draft,
    sms_version,
    timestamp,
    barangay_name,
  }

  return { approved_bulletin }
}
