import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { Langfuse } from 'langfuse'
import { z } from 'zod'
import { createOpenRouterClient, PRIMARY_MODEL, FALLBACK_MODEL } from '@/lib/openrouter'
import { bulletinSchema, BULLETIN_SYSTEM_PROMPT, type Bulletin } from '@/lib/bulletin-schema'
import { retrieveRAGContext, formatRAGContextForPrompt } from '@/lib/rag/retriever'

const requestSchema = z.object({
  barangay: z.string(),
  environmental_data: z.record(z.string(), z.unknown()),
  location: z
    .object({ lat: z.number(), lng: z.number() })
    .optional(),
})

function getLangfuse() {
  return new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY ?? '',
    secretKey: process.env.LANGFUSE_SECRET_KEY ?? '',
    baseUrl: process.env.LANGFUSE_BASE_URL ?? process.env.LANGFUSE_HOST,
  })
}

async function callModel(modelId: string, prompt: string): Promise<Bulletin> {
  const openrouter = createOpenRouterClient()
  const result = await generateObject({
    model: openrouter(modelId),
    schema: bulletinSchema,
    system: BULLETIN_SYSTEM_PROMPT,
    prompt,
    maxRetries: 0,
  })
  return result.object
}

async function generateWithRetry(
  prompt: string,
  langfuse: Langfuse,
  traceId: string,
): Promise<{ bulletin: Bulletin; model: string; attempts: number }> {
  const MAX_PRIMARY_ATTEMPTS = 3
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_PRIMARY_ATTEMPTS; attempt++) {
    const generation = langfuse.generation({
      traceId,
      name: `bulletin-generation-attempt-${attempt}`,
      model: PRIMARY_MODEL,
      input: prompt,
      metadata: { attempt, model: PRIMARY_MODEL },
    })

    try {
      const bulletin = await callModel(PRIMARY_MODEL, prompt)
      generation.end({ output: bulletin, level: 'DEFAULT' })
      return { bulletin, model: PRIMARY_MODEL, attempts: attempt }
    } catch (error) {
      lastError = error
      generation.end({
        output: String(error),
        level: 'ERROR',
        statusMessage: `Attempt ${attempt} failed`,
      })
    }
  }

  const fallbackGeneration = langfuse.generation({
    traceId,
    name: 'bulletin-generation-fallback',
    model: FALLBACK_MODEL,
    input: prompt,
    metadata: { model: FALLBACK_MODEL, reason: 'primary_exhausted' },
  })

  try {
    const bulletin = await callModel(FALLBACK_MODEL, prompt)
    fallbackGeneration.end({ output: bulletin, level: 'DEFAULT' })
    return { bulletin, model: FALLBACK_MODEL, attempts: MAX_PRIMARY_ATTEMPTS + 1 }
  } catch (error) {
    fallbackGeneration.end({ output: String(error), level: 'ERROR' })
    throw new Error(
      `All models failed. Last primary error: ${String(lastError)}. Fallback error: ${String(error)}`,
    )
  }
}

export async function POST(req: NextRequest) {
  const langfuse = getLangfuse()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { barangay, environmental_data, location } = parsed.data

  const trace = langfuse.trace({
    name: 'bulletin-generate',
    input: { barangay, location, environmental_data },
    metadata: { barangay, location },
  })

  // Summarise environmental data for RAG query
  const conditionsSummary = Object.entries(environmental_data)
    .slice(0, 6)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')

  // Retrieve RAG context — geographic profile, historical records, NDRRMC protocols
  let ragContextBlock = ''
  try {
    const ragContext = await retrieveRAGContext(barangay, conditionsSummary)
    ragContextBlock = formatRAGContextForPrompt(ragContext)
  } catch (err) {
    // RAG failure is non-fatal — generate bulletin without context
    console.warn('RAG retrieval failed, generating without context:', err)
    trace.update({ metadata: { rag_skipped: true, rag_error: String(err) } })
  }

  const prompt = ragContextBlock
    ? `Generate a 72-hour risk bulletin for ${barangay}${
        location ? ` (lat: ${location.lat}, lng: ${location.lng})` : ''
      } based on this environmental data:\n\n${JSON.stringify(environmental_data, null, 2)}\n\n${ragContextBlock}`
    : `Generate a 72-hour risk bulletin for ${barangay}${
        location ? ` (lat: ${location.lat}, lng: ${location.lng})` : ''
      } based on this environmental data:\n\n${JSON.stringify(environmental_data, null, 2)}`

  try {
    const { bulletin, model, attempts } = await generateWithRetry(prompt, langfuse, trace.id)

    trace.update({
      output: bulletin,
      metadata: { model_used: model, attempts, rag_context_used: ragContextBlock.length > 0 },
    })

    await langfuse.flushAsync()
    return NextResponse.json({ ...bulletin, _meta: { model, attempts } })
  } catch (error) {
    trace.update({ output: String(error), metadata: { error: true } })
    await langfuse.flushAsync()
    return NextResponse.json(
      { error: 'Bulletin generation failed', details: String(error) },
      { status: 502 },
    )
  }
}
