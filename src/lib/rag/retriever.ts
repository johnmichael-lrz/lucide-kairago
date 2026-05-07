/**
 * LlamaIndex-style RAG retriever backed by Supabase pgvector.
 * Retrieves barangay context, historical records, and NDRRMC protocols,
 * then reranks results using Cohere Rerank 3.5 before returning to the LLM.
 */

import { supabaseAdmin } from './supabase-client'
import { embedQuery } from './embeddings'
import { rerankDocuments, type RerankDocument } from './reranker'

export interface RetrievedContext {
  barangayProfile: string
  historicalRecords: string
  protocols: string
}

// Retrieve the geographic profile for a barangay by name
async function retrieveBarangayProfile(barangayName: string): Promise<string> {
  const queryEmbedding = await embedQuery(
    `geographic profile location elevation flood risk ${barangayName}`,
  )

  const { data, error } = await supabaseAdmin.rpc('match_barangay_profiles', {
    query_embedding: queryEmbedding,
    match_count: 3,
  })

  if (error || !data || data.length === 0) {
    return `No geographic profile found for ${barangayName}.`
  }

  // Find exact match first, fall back to highest similarity
  const exact = data.find(
    (r: { name: string }) => r.name.toLowerCase() === barangayName.toLowerCase(),
  )
  const profile = exact ?? data[0]

  return [
    `Barangay: ${profile.name}, ${profile.municipality}, ${profile.province}`,
    `Elevation: ${profile.elevation}m | Coastal proximity: ${profile.coastal_proximity}km`,
    `River basin: ${profile.river_basin}`,
    `Historical flood extent: ${profile.historical_flood_extent}`,
    `Evacuation centers: ${profile.evacuation_centers?.join(', ') ?? 'Not specified'}`,
  ].join('\n')
}

// Retrieve historical disaster records relevant to the barangay and current conditions
async function retrieveHistoricalRecords(
  barangayName: string,
  conditionsSummary: string,
): Promise<string> {
  const query = `historical typhoon flood disaster impact ${barangayName} ${conditionsSummary}`
  const queryEmbedding = await embedQuery(query)

  const { data, error } = await supabaseAdmin.rpc('match_historical_records', {
    query_embedding: queryEmbedding,
    match_count: 6,
  })

  if (error || !data || data.length === 0) {
    return 'No historical disaster records available.'
  }

  // Rerank with Cohere for relevance to the specific query
  const docs: RerankDocument[] = data.map(
    (r: {
      event_name: string
      event_type: string
      severity: string
      conditions: string
      impact: string
    }) => ({
      text: `Event: ${r.event_name} (${r.event_type})\nSeverity: ${r.severity}\nConditions: ${r.conditions}\nImpact: ${r.impact}`,
      metadata: r,
    }),
  )

  const reranked = await rerankDocuments(query, docs, 3)

  return reranked
    .map((r) => r.text)
    .join('\n\n---\n\n')
}

// Retrieve NDRRMC protocol matching the risk level
async function retrieveProtocol(riskLevel: string): Promise<string> {
  const query = `NDRRMC protocol recommended actions ${riskLevel} evacuation disaster response`
  const queryEmbedding = await embedQuery(query)

  const { data, error } = await supabaseAdmin.rpc('match_ndrrmc_protocols', {
    query_embedding: queryEmbedding,
    match_count: 3,
  })

  if (error || !data || data.length === 0) {
    return 'No NDRRMC protocol data available.'
  }

  // Rerank and pick the most relevant
  const docs: RerankDocument[] = data.map(
    (r: { alert_level: string; protocol_text: string; recommended_actions: string[] }) => ({
      text: `Alert Level: ${r.alert_level}\n${r.protocol_text}\nActions: ${r.recommended_actions?.join('; ')}`,
      metadata: r,
    }),
  )

  const reranked = await rerankDocuments(query, docs, 1)
  return reranked[0]?.text ?? docs[0].text
}

// Main retrieval function — assembles full RAG context for the bulletin LLM
export async function retrieveRAGContext(
  barangayName: string,
  conditionsSummary: string,
  estimatedRiskLevel: string = 'MODERATE RISK',
): Promise<RetrievedContext> {
  const [barangayProfile, historicalRecords, protocols] = await Promise.all([
    retrieveBarangayProfile(barangayName).catch(() => 'Geographic profile unavailable.'),
    retrieveHistoricalRecords(barangayName, conditionsSummary).catch(
      () => 'Historical records unavailable.',
    ),
    retrieveProtocol(estimatedRiskLevel).catch(() => 'Protocol data unavailable.'),
  ])

  return { barangayProfile, historicalRecords, protocols }
}

export function formatRAGContextForPrompt(context: RetrievedContext): string {
  return `
=== BARANGAY GEOGRAPHIC PROFILE ===
${context.barangayProfile}

=== HISTORICAL DISASTER RECORDS ===
${context.historicalRecords}

=== NDRRMC RESPONSE PROTOCOL ===
${context.protocols}
`.trim()
}
