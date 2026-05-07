import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (!lat || !lng) {
    return Response.json({ error: "lat and lng are required" }, { status: 400 });
  }

  // Free reverse geocoder: OpenStreetMap Nominatim (server-side to avoid CORS).
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lng);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim requires a UA identifying the application.
        "User-Agent": "Kairago/1.0 (reverse geocode)",
        Accept: "application/json",
      },
      // Keep results fresh for location usage
      cache: "no-store",
    });
    if (!res.ok) {
      return Response.json(
        { error: `Reverse geocode failed (${res.status})` },
        { status: 502 }
      );
    }
    const data = await res.json();
    return Response.json(
      {
        display_name: data?.display_name ?? null,
        address: data?.address ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    return Response.json(
      { error: "Reverse geocode failed", details: String(err) },
      { status: 502 }
    );
  }
}

