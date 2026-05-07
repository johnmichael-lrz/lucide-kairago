export interface NormalizedEnvironmentalData {
  barangay: string;
  latitude: number;
  longitude: number;
  rainfall_mm_per_hour: number;
  wind_speed_kph: number;
  storm_surge_risk: boolean;
  visibility_km: number;
  humidity_percentage: number;
  temperature_celsius: number;
  data_sources: string[];
  timestamp: string;
  confidence: "HIGH" | "MODERATE" | "LOW";
}

export interface NormalizedResponse {
  data: NormalizedEnvironmentalData;
  is_fallback: boolean;
  fallback_reason?: string;
}

// ── NASA POWER ──────────────────────────────────────────────────────────────

interface NasaPowerParameter {
  WS10M?: Record<string, number>;
  PRECTOTCORR?: Record<string, number>;
  RH2M?: Record<string, number>;
  T2M?: Record<string, number>;
  ALLSKY_SFC_SW_DWN?: Record<string, number>;
}

interface NasaPowerRaw {
  properties?: {
    parameter?: NasaPowerParameter;
  };
}

function latestValue(data: Record<string, number> | undefined): number | null {
  if (!data) return null;
  const sorted = Object.keys(data).sort().reverse();
  for (const key of sorted) {
    const v = data[key];
    if (typeof v === "number" && v !== -999 && v !== -9999) return v;
  }
  return null;
}

export function normalizeNasaPower(
  raw: NasaPowerRaw,
  barangay: string,
  latitude: number,
  longitude: number
): NormalizedEnvironmentalData {
  const params = raw.properties?.parameter ?? {};
  const windMs = latestValue(params.WS10M) ?? 2;
  const rain = latestValue(params.PRECTOTCORR) ?? 0;
  const humidity = latestValue(params.RH2M) ?? 75;
  const tempC = latestValue(params.T2M) ?? 28;
  const windKph = windMs * 3.6;

  return {
    barangay,
    latitude,
    longitude,
    rainfall_mm_per_hour: Math.max(0, Math.round(rain * 100) / 100),
    wind_speed_kph: Math.round(windKph * 10) / 10,
    storm_surge_risk: windKph > 89 || rain > 30,
    visibility_km: rain > 10 ? 1 : rain > 5 ? 3 : 10,
    humidity_percentage: Math.round(Math.min(100, Math.max(0, humidity))),
    temperature_celsius: Math.round(tempC * 10) / 10,
    data_sources: ["NASA POWER"],
    timestamp: new Date().toISOString(),
    confidence: "HIGH",
  };
}

// ── NOAA ────────────────────────────────────────────────────────────────────

interface NoaaObservationProperties {
  temperature?: { value: number | null };
  windSpeed?: { value: number | null };
  relativeHumidity?: { value: number | null };
  visibility?: { value: number | null };
  precipitationLastHour?: { value: number | null };
}

interface NoaaObservationRaw {
  properties?: NoaaObservationProperties;
}

export function normalizeNoaa(
  raw: NoaaObservationRaw,
  barangay: string,
  latitude: number,
  longitude: number
): NormalizedEnvironmentalData {
  const p = raw.properties ?? {};
  const tempC = p.temperature?.value ?? 28;
  const windMps = p.windSpeed?.value ?? 2;
  const windKph = windMps * 3.6;
  const humidity = p.relativeHumidity?.value ?? 75;
  const visM = p.visibility?.value ?? 10000;
  const rainMm = p.precipitationLastHour?.value ?? 0;

  return {
    barangay,
    latitude,
    longitude,
    rainfall_mm_per_hour: Math.max(0, Math.round(rainMm * 100) / 100),
    wind_speed_kph: Math.round(windKph * 10) / 10,
    storm_surge_risk: windKph > 89 || rainMm > 30,
    visibility_km: Math.round((visM / 1000) * 10) / 10,
    humidity_percentage: Math.round(Math.min(100, Math.max(0, humidity))),
    temperature_celsius: Math.round(tempC * 10) / 10,
    data_sources: ["NOAA"],
    timestamp: new Date().toISOString(),
    confidence: "HIGH",
  };
}

// ── Merge + Fallback ─────────────────────────────────────────────────────────

export function mergeEnvironmentalData(
  parts: NormalizedEnvironmentalData[]
): NormalizedEnvironmentalData {
  if (parts.length === 0) throw new Error("No data to merge");
  if (parts.length === 1) return parts[0];

  const avg = (vals: number[]) => vals.reduce((a, b) => a + b, 0) / vals.length;
  const nums = <K extends keyof NormalizedEnvironmentalData>(key: K) =>
    parts.map((p) => p[key] as number);

  return {
    barangay: parts[0].barangay,
    latitude: parts[0].latitude,
    longitude: parts[0].longitude,
    rainfall_mm_per_hour: Math.round(avg(nums("rainfall_mm_per_hour")) * 100) / 100,
    wind_speed_kph: Math.round(avg(nums("wind_speed_kph")) * 10) / 10,
    storm_surge_risk: parts.some((p) => p.storm_surge_risk),
    visibility_km: Math.round(avg(nums("visibility_km")) * 10) / 10,
    humidity_percentage: Math.round(avg(nums("humidity_percentage"))),
    temperature_celsius: Math.round(avg(nums("temperature_celsius")) * 10) / 10,
    data_sources: [...new Set(parts.flatMap((p) => p.data_sources))],
    timestamp: new Date().toISOString(),
    confidence: parts.length >= 2 ? "HIGH" : "MODERATE",
  };
}

export function fallbackEnvironmentalData(
  barangay: string,
  latitude: number,
  longitude: number
): NormalizedEnvironmentalData {
  return {
    barangay,
    latitude,
    longitude,
    rainfall_mm_per_hour: 0,
    wind_speed_kph: 10,
    storm_surge_risk: false,
    visibility_km: 10,
    humidity_percentage: 75,
    temperature_celsius: 28,
    data_sources: [],
    timestamp: new Date().toISOString(),
    confidence: "LOW",
  };
}
