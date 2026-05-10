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

export interface OpenMeteoForecast {
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation: number[]
    precipitation_probability: number[]
    windspeed_10m: number[]
    relativehumidity_2m: number[]
    weathercode: number[]
  }
}

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

export async function fetchOpenMeteo(
  lat: number,
  lng: number,
  barangay: string,
): Promise<{ normalized: NormalizedEnvironmentalData; forecast: OpenMeteoForecast | null }> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('hourly', 'temperature_2m,precipitation,precipitation_probability,windspeed_10m,relativehumidity_2m,weathercode')
  url.searchParams.set('forecast_days', '3')
  url.searchParams.set('timezone', 'Asia/Manila')
  url.searchParams.set('windspeed_unit', 'kmh')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)

    const data: OpenMeteoForecast = await res.json()
    const h = data.hourly

    const slice = 6
    const avg = (arr: number[]) =>
      arr.slice(0, slice).reduce((a, b) => a + b, 0) / Math.min(slice, arr.length)

    const avgRainfall = avg(h.precipitation)
    const avgWind = avg(h.windspeed_10m)
    const avgHumidity = avg(h.relativehumidity_2m)
    const avgTemp = avg(h.temperature_2m)
    const maxPrecipProb = Math.max(...h.precipitation_probability.slice(0, 24))

    // Use fallbackEnvironmentalData as base to match the exact type shape,
    // then override with real Open-Meteo values
    const normalized: NormalizedEnvironmentalData = {
      ...fallbackEnvironmentalData(barangay, lat, lng),
      rainfall_mm_per_hour: Math.round(avgRainfall * 10) / 10,
      wind_speed_kph: Math.round(avgWind * 10) / 10,
      humidity_percentage: Math.round(avgHumidity),
      temperature_celsius: Math.round(avgTemp * 10) / 10,
      storm_surge_risk: maxPrecipProb > 80,
      data_sources: ['Open-Meteo'],
    }

    return { normalized, forecast: data }
  } catch {
    clearTimeout(timeout)
    return {
      normalized: {
        ...fallbackEnvironmentalData(barangay, lat, lng),
        data_sources: ['Open-Meteo (fallback)'],
      },
      forecast: null,
    }
  }
}

function buildForecastSummary(forecast: OpenMeteoForecast | null): string {
  if (!forecast) return ''
  const h = forecast.hourly
  const next24 = h.time.slice(0, 24).map((time, i) => ({
    time,
    temp: h.temperature_2m[i],
    rain: h.precipitation[i],
    rainProb: h.precipitation_probability[i],
    wind: h.windspeed_10m[i],
  }))
  const summary = next24
    .filter((_, i) => i % 6 === 0)
    .map(h => `${h.time}: ${h.temp}°C, ${h.rain}mm rain, ${h.rainProb}% chance, ${h.wind}kph wind`)
    .join('\n')
  return `\n\n72-HOUR OPEN-METEO FORECAST (Philippines local time):\n${summary}`
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
  forecastSummary: string,
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
    // RAG failure is non-fatal
  }

  const prompt = `Generate a 72-hour risk bulletin for ${barangayName} (lat: ${envData.latitude}, lng: ${envData.longitude}) based on this environmental data:\n\n${JSON.stringify(envData, null, 2)}${forecastSummary}${ragContextBlock ? `\n\n${ragContextBlock}` : ''}`

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

  yield { type: 'progress', message: 'Fetching environmental data from PAGASA, NASA POWER, and Open-Meteo...' }
  const [nasaData, noaaData, { normalized: openMeteoData, forecast }] = await Promise.all([
    fetchNasaPower(location.latitude, location.longitude, location.name),
    fetchNoaa(location.latitude, location.longitude, location.name),
    fetchOpenMeteo(location.latitude, location.longitude, location.name),
  ])

  yield { type: 'progress', message: 'Analyzing risk level across data sources...' }
  const envData = mergeEnvironmentalData([nasaData, noaaData, openMeteoData])
  const forecastSummary = buildForecastSummary(forecast)

  yield { type: 'progress', message: 'Generating bulletin with 72-hour forecast...' }
  let bulletin: Bulletin
  try {
    bulletin = await generateBulletin(location.name, envData, forecastSummary)
  } catch (err) {
    yield { type: 'error', message: `Bulletin generation failed: ${String(err)}` }
    return
  }

  yield { type: 'progress', message: 'Quality checking...' }
  const parsed = bulletinSchema.safeParse(bulletin)
  if (!parsed.success) {
    try {
      bulletin = await generateBulletin(location.name, envData, forecastSummary)
    } catch (err) {
      yield { type: 'error', message: `Quality check retry failed: ${String(err)}` }
      return
    }
  }

  yield { type: 'progress', message: 'Ready.' }
  yield { type: 'bulletin', data: bulletin, barangay: location.name, environmental_data: envData }
}