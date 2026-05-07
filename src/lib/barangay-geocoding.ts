import barangays from "@/data/barangays.json";

export interface BarangayLocation {
  name: string;
  municipality: string;
  province: string;
  region: string;
  latitude: number;
  longitude: number;
}

export const BARANGAYS: BarangayLocation[] = barangays as BarangayLocation[];

export function findBarangayByName(name: string): BarangayLocation | undefined {
  const q = name.trim().toLowerCase();
  return BARANGAYS.find((b) => b.name.toLowerCase() === q);
}

export function searchBarangays(query: string): BarangayLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return BARANGAYS.filter((b) => {
    return (
      b.name.toLowerCase().includes(q) ||
      b.municipality.toLowerCase().includes(q) ||
      b.province.toLowerCase().includes(q)
    );
  });
}
