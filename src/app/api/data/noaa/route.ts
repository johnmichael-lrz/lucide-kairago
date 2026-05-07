import { type NextRequest } from "next/server";
import { cacheGet, cacheSet, cacheGetStale } from "@/lib/api-cache";
import {
  normalizeNoaa,
  fallbackEnvironmentalData,
  type NormalizedResponse,
} from "@/lib/normalize";
import { findBarangayByName } from "@/lib/barangay-geocoding";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/geo+json",
        "User-Agent": "Kairago/1.0 (kairago.vercel.app)",
      },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
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

  const cacheKey = `noaa:${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = cacheGet<NormalizedResponse>(cacheKey);
  if (cached) return Response.json(cached);

  const resolved =
    findBarangayByName(barangayParam) ??
    ({ name: barangayParam, latitude: lat, longitude: lng } as const);

  try {
    // Step 1: Resolve the NWS grid point (US coverage only — fails for PH coords).
    const pointsRes = await fetchWithTimeout(
      `https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`,
      10_000
    );

    if (!pointsRes.ok) {
      throw new Error(`NOAA points API: ${pointsRes.status} — location may be outside US coverage`);
    }

    const pointsData = await pointsRes.json();
    const observationsUrl: string | undefined =
      pointsData?.properties?.observationStations;

    if (!observationsUrl) {
      throw new Error("NOAA: no observation stations URL in response");
    }

    // Step 2: Get nearest observation station.
    const stationsRes = await fetchWithTimeout(observationsUrl, 10_000);
    if (!stationsRes.ok) throw new Error(`NOAA stations: ${stationsRes.status}`);

    const stationsData = await stationsRes.json();
    const stationId: string | undefined =
      stationsData?.features?.[0]?.properties?.stationIdentifier;

    if (!stationId) throw new Error("NOAA: no station found");

    // Step 3: Get latest observation from that station.
    const obsRes = await fetchWithTimeout(
      `https://api.weather.gov/stations/${stationId}/observations/latest`,
      10_000
    );
    if (!obsRes.ok) throw new Error(`NOAA observation: ${obsRes.status}`);

    const obsData = await obsRes.json();
    const data = normalizeNoaa(obsData, resolved.name, lat, lng);
    const response: NormalizedResponse = { data, is_fallback: false };

    cacheSet(cacheKey, response, CACHE_TTL_MS);
    return Response.json(response);
  } catch (err) {
    const stale = cacheGetStale<NormalizedResponse>(cacheKey);
    if (stale) {
      return Response.json({
        ...stale,
        is_fallback: true,
        fallback_reason: "NOAA unavailable — serving cached data",
      } satisfies NormalizedResponse);
    }

    // NOAA only covers US territories; Philippine coordinates will always
    // reach this branch. Return a clearly-labeled fallback so the frontend
    // always has data.
    const reason =
      err instanceof Error ? err.message : "NOAA unavailable";
    const response: NormalizedResponse = {
      data: {
        ...fallbackEnvironmentalData(resolved.name, lat, lng),
        data_sources: ["NOAA (fallback)"],
      },
      is_fallback: true,
      fallback_reason: reason,
    };
    return Response.json(response);
  }
}
