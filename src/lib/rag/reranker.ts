// Cohere Rerank 3.5 integration for relevance-based document reranking

const COHERE_RERANK_URL = 'https://api.cohere.com/v2/rerank'
const COHERE_RERANK_MODEL = 'rerank-v3.5'

export interface RerankDocument {
  text: string
  metadata?: Record<string, unknown>
}

export interface RankedDocument extends RerankDocument {
  relevance_score: number
  index: number
}

export async function rerankDocuments(
  query: string,
  documents: RerankDocument[],
  topN?: number,
): Promise<RankedDocument[]> {
  const apiKey = process.env.COHERE_API_KEY
  if (!apiKey) throw new Error('COHERE_API_KEY not set')

  if (documents.length === 0) return []

  const response = await fetch(COHERE_RERANK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: COHERE_RERANK_MODEL,
      query,
      documents: documents.map((d) => d.text),
      top_n: topN ?? documents.length,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    // Fall back to original order on rerank failure
    console.warn(`Cohere rerank failed (${response.status}): ${err}. Using original order.`)
    return documents.map((doc, i) => ({ ...doc, relevance_score: 1 - i * 0.1, index: i }))
  }

  const data = await response.json()
  return data.results.map((r: { index: number; relevance_score: number }) => ({
    ...documents[r.index],
    relevance_score: r.relevance_score,
    index: r.index,
  }))
}
