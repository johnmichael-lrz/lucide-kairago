// Voyage AI embedding generation using voyage-2 (1536 dimensions)

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-2'

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_AI_API_KEY
  if (!apiKey) throw new Error('VOYAGE_AI_API_KEY not set')

  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text],
      input_type: 'document',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Voyage AI embedding failed: ${response.status} ${err}`)
  }

  const data = await response.json()
  return data.data[0].embedding as number[]
}

export async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_AI_API_KEY
  if (!apiKey) throw new Error('VOYAGE_AI_API_KEY not set')

  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text],
      input_type: 'query',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Voyage AI query embedding failed: ${response.status} ${err}`)
  }

  const data = await response.json()
  return data.data[0].embedding as number[]
}

// Batch embed multiple texts with rate-limit-safe sequential processing
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = []
  for (const text of texts) {
    results.push(await embedText(text))
    // Respect Voyage AI rate limits
    await new Promise((r) => setTimeout(r, 100))
  }
  return results
}
