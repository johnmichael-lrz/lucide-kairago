import { cacheGet, cacheSet } from "@/lib/api-cache";

type HealthColor = "green" | "yellow" | "red";

interface SourceStatus {
  status: HealthColor;
  label: string;
  latency_ms: number | null;
  detail?: string;
}

export interface HealthResponse {
  sources: {
    nasa_power: SourceStatus;
    noaa: SourceStatus;
  };
  timestamp: string;
}

const CACHE_TTL_MS = 30_000; // 30 seconds
const CACHE_KEY = "health:status";

async function checkEndpoint(
  url: string,
  timeoutMs: number
): Promise<{ ok: boolean; latencyMs: number; detail?: string }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    const latencyMs = Date.now() - start;
    clearTimeout(id);
    return { ok: res.ok || res.status < 500, latencyMs };
  } catch (err) {
    clearTimeout(id);
    const latencyMs = Date.now() - start;
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, latencyMs, detail };
  }
}

function latencyToColor(latencyMs: number, ok: boolean): HealthColor {
  if (!ok) return "red";
  if (latencyMs < 2000) return "green";
  if (latencyMs < 5000) return "yellow";
  return "red";
}

export async function GET() {
  const cached = cacheGet<HealthResponse>(CACHE_KEY);
  if (cached) return Response.json(cached);

  const [nasaResult, noaaResult] = await Promise.all([
    checkEndpoint(
      "https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M&community=RE&longitude=121.0794&latitude=14.6507&start=20260101&end=20260101&format=JSON",
      8_000
    ),
    checkEndpoint("https://api.weather.gov/", 8_000),
  ]);

  const nasaColor = latencyToColor(nasaResult.latencyMs, nasaResult.ok);
  const noaaColor = latencyToColor(noaaResult.latencyMs, noaaResult.ok);

  const response: HealthResponse = {
    sources: {
      nasa_power: {
        status: nasaColor,
        label: "NASA POWER",
        latency_ms: nasaResult.latencyMs,
        detail: nasaResult.detail,
      },
      noaa: {
        status: noaaColor,
        label: "NOAA",
        latency_ms: noaaResult.latencyMs,
        detail: noaaResult.detail,
      },
    },
    timestamp: new Date().toISOString(),
  };

  cacheSet(CACHE_KEY, response, CACHE_TTL_MS);
  return Response.json(response);
}
