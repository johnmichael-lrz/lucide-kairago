import { generateObject } from 'ai'
import {
  normalizeNasaPower,
  normalizeNoaa,
  mergeEnvironmentalData,
  fallbackEnvironmentalData,
  type NormalizedEnvironmentalData,
} from '@/lib/normalize'
import { findBarangayByName, BARANGAYS } from '@/lib/barangay-geocoding'
import { createOpenRouterClient, PRIMARY_MODEL, FALLBACK_MODEL } from '@/lib/openrouter'
import { bulletinSchema, BULLETIN_SYSTEM_PROMPT, type Bulletin } from '@/lib/bulletin-schema'
import { retrieveRAGContext, formatRAGContextForPrompt } from '@/lib/rag/retriever'

export type PipelineEvent =
  | { type: 'progress'; message: string }
  | { type: 'bulletin'; data: Bulletin; barangay: string; environmental_data: NormalizedEnvironmentalData }
  | { type: 'error'; message: string }

async function fetchNasaPower(
  lat: number,
  lng: number,
  barangay: string,
): Promise<NormalizedEnvironmentalData> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const url = new URL('https://power.larc.nasa.gov/api/temporal/hourly/point')
  url.searchParams.set('parameters', 'WS10M,PRECTOTCORR,RH2M,T2M,ALLSKY_SFC_SW_DWN')
  url.searchParams.set('community', 'RE')
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('start', today)
  url.searchParams.set('end', today)
  url.searchParams.set('format', 'JSON')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`NASA POWER ${res.status}`)
    return normalizeNasaPower(await res.json(), barangay, lat, lng)
  } catch {
    clearTimeout(timeout)
    return fallbackEnvironmentalData(barangay, lat, lng)
  }
}

async function fetchNoaa(
  lat: number,
  lng: number,
  barangay: string,
): Promise<NormalizedEnvironmentalData> {
  const headers: HeadersInit = {
    Accept: 'application/geo+json',
    'User-Agent': 'Kairago/1.0 (kairago.vercel.app)',
  }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    const pointsRes = await fetch(
      `https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`,
      { signal: controller.signal, headers },
    )
    clearTimeout(timeout)
    if (!pointsRes.ok) throw new Error(`NOAA points: ${pointsRes.status}`)
    const pointsData = await pointsRes.json()
    const observationsUrl: string | undefined = pointsData?.properties?.observationStations
    if (!observationsUrl) throw new Error('No stations URL')
    const stationsRes = await fetch(observationsUrl, { headers })
    if (!stationsRes.ok) throw new Error(`NOAA stations: ${stationsRes.status}`)
    const stationsData = await stationsRes.json()
    const stationId: string | undefined =
      stationsData?.features?.[0]?.properties?.stationIdentifier
    if (!stationId) throw new Error('No station')
    const obsRes = await fetch(
      `https://api.weather.gov/stations/${stationId}/observations/latest`,
      { headers },
    )
    if (!obsRes.ok) throw new Error(`NOAA obs: ${obsRes.status}`)
    return normalizeNoaa(await obsRes.json(), barangay, lat, lng)
  } catch {
    return { ...fallbackEnvironmentalData(barangay, lat, lng), data_sources: ['NOAA (fallback)'] }
  }
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

async function generateBulletin(
  barangayName: string,
  envData: NormalizedEnvironmentalData,
): Promise<Bulletin> {
  const conditionsSummary = [
    `rainfall: ${envData.rainfall_mm_per_hour} mm/h`,
    `wind: ${envData.wind_speed_kph} kph`,
    `humidity: ${envData.humidity_percentage}%`,
    `temp: ${envData.temperature_celsius}°C`,
    `storm_surge_risk: ${envData.storm_surge_risk}`,
  ].join(', ')

  let ragContextBlock = ''
  try {
    const ragContext = await retrieveRAGContext(barangayName, conditionsSummary)
    ragContextBlock = formatRAGContextForPrompt(ragContext)
  } catch {
    // RAG failure is non-fatal — generate without context
  }

  const prompt = `Generate a 72-hour risk bulletin for ${barangayName} (lat: ${envData.latitude}, lng: ${envData.longitude}) based on this environmental data:\n\n${JSON.stringify(envData, null, 2)}${ragContextBlock ? `\n\n${ragContextBlock}` : ''}`

  try {
    return await callModel(PRIMARY_MODEL, prompt)
  } catch {
    return await callModel(FALLBACK_MODEL, prompt)
  }
}

export async function* runPipeline(
  barangayName: string,
  coordinates?: { lat: number; lng: number },
): AsyncGenerator<PipelineEvent> {
  const seeded = findBarangayByName(barangayName)
  const location = seeded ??
    (coordinates
      ? { name: barangayName, latitude: coordinates.lat, longitude: coordinates.lng }
      : BARANGAYS[0])

  // Agent 1: Fetch environmental data
  yield { type: 'progress', message: 'Fetching environmental data...' }
  const [nasaData, noaaData] = await Promise.all([
    fetchNasaPower(location.latitude, location.longitude, location.name),
    fetchNoaa(location.latitude, location.longitude, location.name),
  ])

  // Agent 2: Analyze risk level
  yield { type: 'progress', message: 'Analyzing risk level...' }
  const envData = mergeEnvironmentalData([nasaData, noaaData])

  // Agent 3: Generate bulletin
  yield { type: 'progress', message: 'Generating bulletin...' }
  let bulletin: Bulletin
  try {
    bulletin = await generateBulletin(location.name, envData)
  } catch (err) {
    yield { type: 'error', message: `Bulletin generation failed: ${String(err)}` }
    return
  }

  // Agent 4: Quality check — validate against schema
  yield { type: 'progress', message: 'Quality checking...' }
  const parsed = bulletinSchema.safeParse(bulletin)
  if (!parsed.success) {
    try {
      bulletin = await generateBulletin(location.name, envData)
    } catch (err) {
      yield { type: 'error', message: `Quality check retry failed: ${String(err)}` }
      return
    }
  }

  // Agent 5: Ready
  yield { type: 'progress', message: 'Ready.' }
  yield { type: 'bulletin', data: bulletin, barangay: location.name, environmental_data: envData }
}
