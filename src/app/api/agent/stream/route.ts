import { type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runPipeline } from '@/lib/agents/pipeline'
import { type Bulletin } from '@/lib/bulletin-schema'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

async function saveBulletinHistory(barangay: string, bulletin: Bulletin) {
  try {
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.from('bulletin_history').insert({
      barangay_name: barangay,
      risk_level: bulletin.risk_level,
      bulletin_text: bulletin.bulletin_text,
      recommended_action: bulletin.recommended_action,
      confidence: bulletin.confidence,
    })
  } catch {
    // Non-fatal: table may not exist yet — run /api/rag/seed to create it
  }
}

export async function POST(req: NextRequest) {
  let body: { barangay_name?: string; coordinates?: { lat: number; lng: number } }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const barangayName = body.barangay_name?.trim()
  if (!barangayName) {
    return new Response(JSON.stringify({ error: 'barangay_name is required' }), { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        for await (const event of runPipeline(barangayName, body.coordinates)) {
          send(event)
          if (event.type === 'bulletin') {
            saveBulletinHistory(event.barangay, event.data)
          }
        }
      } catch (err) {
        send({ type: 'error', message: String(err) })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
