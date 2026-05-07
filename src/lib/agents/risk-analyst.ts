import type { AgentState } from './state'
import { retrieveRAGContext, formatRAGContextForPrompt } from '@/lib/rag/retriever'

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

function parseCoastalProximity(context: string): number {
  const match = context.match(/[Cc]oastal proximity:\s*([\d.]+)\s*km/)
  if (!match) return 10
  const km = parseFloat(match[1])
  // 0km → score 100, 20+km → score 0
  return Math.max(0, Math.round(Math.max(0, (1 - km / 20) * 100)))
}

function parseFloodPattern(context: string): number {
  if (/critical/i.test(context)) return 100
  if (/high/i.test(context)) return 80
  if (/moderate/i.test(context)) return 50
  if (/low/i.test(context)) return 20
  return 30
}

function scoreRainfall(mmPerHour: number): number {
  // 0mm/h → 0, 30+mm/h → 100
  return Math.min(100, Math.round((mmPerHour / 30) * 100))
}

function scoreWind(kph: number): number {
  // 0kph → 0, 100+kph → 100
  return Math.min(100, Math.round((kph / 100) * 100))
}

function mapScoreToLevel(score: number): string {
  if (score <= 30) return 'SAFE'
  if (score <= 65) return 'MODERATE RISK'
  return 'EVACUATE NOW'
}

export async function riskAnalystNode(state: AgentState): Promise<Partial<AgentState>> {
  const { barangay_name, normalized_data } = state

  const rainfall = (normalized_data.rainfall_mm_per_hour as number) ?? 0
  const wind = (normalized_data.wind_speed_kph as number) ?? 0
  const conditionsSummary = `rainfall: ${rainfall}mm/h, wind: ${wind}kph`

  // Query RAG for geographic + historical context
  let ragContext = ''
  try {
    const ctx = await retrieveRAGContext(barangay_name, conditionsSummary)
    ragContext = formatRAGContextForPrompt(ctx)
  } catch {
    ragContext = 'Geographic and historical context unavailable.'
  }

  // Query Mem0 for stored community context
  let mem0Context = ''
  try {
    const client = await getMem0Client()
    if (client) {
      const memories = await client.search(
        `risk bulletin history for ${barangay_name}`,
        { user_id: barangay_name },
      )
      if (Array.isArray(memories) && memories.length > 0) {
        mem0Context =
          '\n\n=== STORED COMMUNITY CONTEXT ===\n' +
          memories
            .slice(0, 3)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((m: any) => m.memory ?? m.text ?? String(m))
            .join('\n')
      }
    }
  } catch {
    // Mem0 failure is non-fatal
  }

  const retrieved_context = ragContext + mem0Context

  const coastalScore = parseCoastalProximity(retrieved_context)
  const floodScore = parseFloodPattern(retrieved_context)

  const risk_score = Math.round(
    scoreRainfall(rainfall) * 0.4 +
      scoreWind(wind) * 0.3 +
      coastalScore * 0.2 +
      floodScore * 0.1,
  )

  const risk_level = mapScoreToLevel(risk_score)

  return { risk_score, risk_level, retrieved_context }
}
