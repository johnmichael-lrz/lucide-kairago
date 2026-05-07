export interface BarangayLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export const BARANGAYS: BarangayLocation[] = [
  { name: "Barangay Pag-asa", latitude: 14.6507, longitude: 121.0794 },
  { name: "Barangay San Roque Marikina", latitude: 14.6507, longitude: 121.1 },
  { name: "Barangay Poblacion Leyte", latitude: 11.2442, longitude: 124.9996 },
];

export function findBarangayByName(name: string): BarangayLocation | undefined {
  return BARANGAYS.find((b) => b.name.toLowerCase() === name.toLowerCase());
}

export function searchBarangays(query: string): BarangayLocation[] {
  if (!query.trim()) return BARANGAYS;
  const q = query.toLowerCase();
  return BARANGAYS.filter((b) => b.name.toLowerCase().includes(q));
}
