import type { AgentState } from './state'

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export async function communicationSpecialistNode(
  state: AgentState,
): Promise<Partial<AgentState>> {
  const { barangay_name, coordinates, normalized_data, risk_score, risk_level, retrieved_context } =
    state

  const base = getBaseUrl()
  const response = await fetch(`${base}/api/bulletin/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barangay: barangay_name,
      environmental_data: {
        ...normalized_data,
        risk_score,
        risk_level,
        rag_context_summary: retrieved_context.slice(0, 500),
      },
      location: coordinates,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Bulletin generation failed: ${response.status} — ${err}`)
  }

  const bulletin_draft = (await response.json()) as Record<string, unknown>

  return { bulletin_draft }
}
