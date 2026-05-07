import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { Langfuse } from 'langfuse'
import { z } from 'zod'
import { createOpenRouterClient, PRIMARY_MODEL } from '@/lib/openrouter'

const requestSchema = z.object({
  text: z.string().min(1),
  target_language: z.enum(['Filipino', 'Cebuano']),
})

const translationSchema = z.object({
  translated_text: z.string(),
  source_language: z.literal('English'),
  target_language: z.string(),
})

function getLangfuse() {
  return new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY ?? '',
    secretKey: process.env.LANGFUSE_SECRET_KEY ?? '',
    baseUrl: process.env.LANGFUSE_BASE_URL ?? process.env.LANGFUSE_HOST,
  })
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

  const { text, target_language } = parsed.data

  const trace = langfuse.trace({
    name: 'bulletin-translate',
    input: { text, target_language },
    metadata: { target_language },
  })

  const generation = langfuse.generation({
    traceId: trace.id,
    name: 'translation',
    model: PRIMARY_MODEL,
    input: { text, target_language },
  })

  const openrouter = createOpenRouterClient()

  try {
    const result = await generateObject({
      model: openrouter(PRIMARY_MODEL),
      schema: translationSchema,
      system: `You are a professional translator for community disaster risk communications in the Philippines. Translate the given English bulletin text into ${target_language} while preserving the exact meaning, risk level, and plain-language Grade 6 reading level. Keep "your community" as the subject. Return only valid JSON with no markdown code fences.`,
      prompt: `Translate this English bulletin text into ${target_language}:\n\n"${text}"\n\nReturn JSON with fields: translated_text, source_language ("English"), target_language ("${target_language}").`,
    })

    generation.end({ output: result.object, level: 'DEFAULT' })
    trace.update({ output: result.object })
    await langfuse.flushAsync()

    return NextResponse.json(result.object)
  } catch (error) {
    generation.end({ output: String(error), level: 'ERROR' })
    trace.update({ output: String(error), metadata: { error: true } })
    await langfuse.flushAsync()

    return NextResponse.json(
      { error: 'Translation failed', details: String(error) },
      { status: 502 },
    )
  }
}
