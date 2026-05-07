import { type NextRequest } from "next/server";
import { searchBarangays } from "@/lib/barangay-geocoding";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const results = searchBarangays(query);
  return Response.json({ results });
}
