import { type NextRequest } from "next/server";
import { cacheGet, cacheSet, cacheGetStale } from "@/lib/api-cache";
import {
  normalizeNasaPower,
  fallbackEnvironmentalData,
  type NormalizedResponse,
} from "@/lib/normalize";
import { findBarangayByName } from "@/lib/barangay-geocoding";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function todayYYYYMMDD(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const barangayParam = searchParams.get("barangay") ?? "Unknown";

  const lat = latParam ? parseFloat(latParam) : NaN;
  const lng = lngParam ? parseFloat(lngParam) : NaN;

  if (isNaN(lat) || isNaN(lng)) {
    return Response.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 }
    );
  }

  const cacheKey = `nasa-power:${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = cacheGet<NormalizedResponse>(cacheKey);
  if (cached) return Response.json(cached);

  // Resolve barangay name from seeded list or use the passed param.
  const resolved =
    findBarangayByName(barangayParam) ??
    ({ name: barangayParam, latitude: lat, longitude: lng } as const);

  const today = todayYYYYMMDD();
  const url = new URL("https://power.larc.nasa.gov/api/temporal/hourly/point");
  url.searchParams.set("parameters", "WS10M,PRECTOTCORR,RH2M,T2M,ALLSKY_SFC_SW_DWN");
  url.searchParams.set("community", "RE");
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("start", today);
  url.searchParams.set("end", today);
  url.searchParams.set("format", "JSON");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`NASA POWER responded ${res.status}`);
    }

    const raw = await res.json();
    const data = normalizeNasaPower(raw, resolved.name, lat, lng);
    const response: NormalizedResponse = { data, is_fallback: false };

    cacheSet(cacheKey, response, CACHE_TTL_MS);
    return Response.json(response);
  } catch (err) {
    // Return stale cache if available, otherwise synthesize a fallback.
    const stale = cacheGetStale<NormalizedResponse>(cacheKey);
    if (stale) {
      const fallback: NormalizedResponse = {
        ...stale,
        is_fallback: true,
        fallback_reason: "NASA POWER unavailable — serving cached data",
      };
      return Response.json(fallback);
    }

    const reason =
      err instanceof Error ? err.message : "NASA POWER unavailable";
    const response: NormalizedResponse = {
      data: fallbackEnvironmentalData(resolved.name, lat, lng),
      is_fallback: true,
      fallback_reason: reason,
    };
    return Response.json(response);
  }
}
