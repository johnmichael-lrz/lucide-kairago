import type { AgentState } from './state'
import { mergeEnvironmentalData, fallbackEnvironmentalData } from '@/lib/normalize'
import type { NormalizedEnvironmentalData, NormalizedResponse } from '@/lib/normalize'

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

// Rough historical baselines for anomaly detection
const HISTORICAL_BASELINES = {
  rainfall_mm_per_hour: 2.5,
  wind_speed_kph: 15,
}

export async function dataFetcherNode(state: AgentState): Promise<Partial<AgentState>> {
  const { barangay_name, coordinates } = state
  const { lat, lng } = coordinates
  const base = getBaseUrl()

  const [nasaResult, noaaResult] = await Promise.allSettled([
    fetch(
      `${base}/api/data/nasa-power?lat=${lat}&lng=${lng}&barangay=${encodeURIComponent(barangay_name)}`,
    ),
    fetch(
      `${base}/api/data/noaa?lat=${lat}&lng=${lng}&barangay=${encodeURIComponent(barangay_name)}`,
    ),
  ])

  const normalizedParts: NormalizedEnvironmentalData[] = []
  let raw_nasa_power: Record<string, unknown> = {}
  let raw_noaa: Record<string, unknown> = {}

  if (nasaResult.status === 'fulfilled' && nasaResult.value.ok) {
    const json = (await nasaResult.value.json()) as NormalizedResponse
    raw_nasa_power = json as unknown as Record<string, unknown>
    if (json.data) normalizedParts.push(json.data)
  }

  if (noaaResult.status === 'fulfilled' && noaaResult.value.ok) {
    const json = (await noaaResult.value.json()) as NormalizedResponse
    raw_noaa = json as unknown as Record<string, unknown>
    if (json.data) normalizedParts.push(json.data)
  }

  const merged =
    normalizedParts.length > 0
      ? mergeEnvironmentalData(normalizedParts)
      : fallbackEnvironmentalData(barangay_name, lat, lng)

  const anomalies: string[] = []
  if (merged.rainfall_mm_per_hour > HISTORICAL_BASELINES.rainfall_mm_per_hour * 3) {
    anomalies.push(
      `Rainfall anomaly: ${merged.rainfall_mm_per_hour}mm/h (3× historical average)`,
    )
  }
  if (merged.wind_speed_kph > HISTORICAL_BASELINES.wind_speed_kph * 3) {
    anomalies.push(`Wind anomaly: ${merged.wind_speed_kph}kph (3× historical average)`)
  }

  const normalized_data: Record<string, unknown> = {
    ...(merged as unknown as Record<string, unknown>),
    anomalies,
  }

  return {
    raw_nasa_power,
    raw_noaa,
    normalized_data,
    timestamp: new Date().toISOString(),
  }
}
