"use client";

export const dynamic = 'force-dynamic';

import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  ListFilter,
  X,
  AlertTriangle,
  Users,
  ChevronDown,
  Search,
  Layers,
  Navigation,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";

type RiskLevel = "SAFE" | "MODERATE RISK" | "EVACUATE NOW";

interface MarkerData {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  risk: RiskLevel;
  summary: string;
  bulletin: string;
  sources: string[];
  confidence: string;
  timestamp: string;
  peopleAffected?: number;
}

interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
}

const BASE_MARKERS: MarkerData[] = [
  {
    id: "pagasa-qc",
    name: "Barangay Pag-asa",
    region: "Quezon City, NCR",
    lat: 14.6563,
    lng: 121.0322,
    risk: "SAFE",
    summary: "Clear skies and stable conditions. No immediate threat to your community in the next 72 hours.",
    bulletin: "Current atmospheric conditions indicate no immediate threat of flooding or severe weather in Barangay Pag-asa. Satellite data shows clear skies with minimal cloud formation. Local sensors report stable water levels across all primary monitoring stations in Quezon City.",
    sources: ["PAGASA", "NASA POWER", "NOAA"],
    confidence: "HIGH",
    timestamp: new Date().toISOString(),
    peopleAffected: 0,
  },
  {
    id: "poblacion-makati",
    name: "Barangay Poblacion",
    region: "Makati City, NCR",
    lat: 14.5547,
    lng: 121.0244,
    risk: "MODERATE RISK",
    summary: "Heavy rainfall expected in 12 hours. Prepare go-bags and avoid low-lying areas.",
    bulletin: "A sustained band of heavy rainfall is tracking toward the Makati watershed. Runoff is expected to increase rapidly, with a high likelihood of street-level flooding in low-lying zones and near-channel communities within the next 6–12 hours.",
    sources: ["PAGASA", "NASA POWER", "NOAA"],
    confidence: "MODERATE",
    timestamp: new Date().toISOString(),
    peopleAffected: 840,
  },
  {
    id: "sanjose-batangas",
    name: "Barangay San Jose",
    region: "Batangas City, Region IV-A",
    lat: 13.7565,
    lng: 121.0583,
    risk: "SAFE",
    summary: "Conditions are stable. No significant weather events expected in the next 72 hours.",
    bulletin: "Atmospheric data for Barangay San Jose shows stable pressure systems and low rainfall probability. Wind speeds remain within safe thresholds. No typhoon activity detected within 500 km.",
    sources: ["PAGASA", "NASA POWER"],
    confidence: "HIGH",
    timestamp: new Date().toISOString(),
    peopleAffected: 0,
  },
  {
    id: "poblacion-leyte",
    name: "Barangay Poblacion",
    region: "Leyte, Region VIII",
    lat: 11.2442,
    lng: 124.9997,
    risk: "EVACUATE NOW",
    summary: "Typhoon landfall imminent. Evacuate immediately to designated shelters.",
    bulletin: "Typhoon landfall is imminent in Barangay Poblacion. Forecast models indicate destructive winds exceeding 150 kph and rapid surge in rainfall intensity. Water levels have exceeded the 12.5 m threshold. Evacuate immediately to designated shelters and avoid all waterways.",
    sources: ["PAGASA", "NASA POWER", "NOAA", "PHIVOLCS"],
    confidence: "HIGH",
    timestamp: new Date().toISOString(),
    peopleAffected: 1240,
  },
  {
    id: "pagasa-palawan",
    name: "Barangay Pag-asa",
    region: "Puerto Princesa, Palawan",
    lat: 9.8395,
    lng: 118.7367,
    risk: "SAFE",
    summary: "Fair weather prevails. Seas are calm and no weather disturbance detected.",
    bulletin: "Environmental monitoring for Barangay Pag-asa in Palawan shows favorable conditions. Sea surface temperatures are normal and no tropical disturbance has been detected. Clear weather expected for the next 72 hours.",
    sources: ["PAGASA", "NOAA"],
    confidence: "HIGH",
    timestamp: new Date().toISOString(),
    peopleAffected: 0,
  },
];

const RISK_COLORS: Record<RiskLevel, string> = {
  SAFE: "#4ADE80",
  "MODERATE RISK": "#F59E0B",
  "EVACUATE NOW": "#EF4444",
};

const REGION_BOUNDS: Record<string, { center: [number, number]; zoom: number }> = {
  "All Regions": { center: [122, 12], zoom: 5 },
  NCR: { center: [121.05, 14.55], zoom: 11 },
  "Region III": { center: [120.8, 15.2], zoom: 8 },
  "Region IV-A": { center: [121.2, 14.0], zoom: 8 },
  Visayas: { center: [124.0, 11.0], zoom: 7 },
  Mindanao: { center: [124.5, 8.0], zoom: 7 },
};

const REGIONS = Object.keys(REGION_BOUNDS);

function riskBorderClass(risk: RiskLevel) {
  if (risk === "EVACUATE NOW") return "border-[var(--terracotta)]";
  if (risk === "MODERATE RISK") return "border-[var(--golden-yellow)]";
  return "border-[var(--leaf-green)]";
}
function riskTextClass(risk: RiskLevel) {
  if (risk === "EVACUATE NOW") return "text-[var(--terracotta)]";
  if (risk === "MODERATE RISK") return "text-[var(--golden-yellow)]";
  return "text-[var(--leaf-green)]";
}
function riskBgClass(risk: RiskLevel) {
  if (risk === "EVACUATE NOW") return "bg-[color:var(--terracotta)]/12";
  if (risk === "MODERATE RISK") return "bg-[color:var(--golden-yellow)]/12";
  return "bg-[color:var(--leaf-green)]/12";
}
function riskBadgeClass(risk: RiskLevel) {
  if (risk === "EVACUATE NOW")
    return "border-[color:var(--terracotta)]/40 bg-[color:var(--terracotta)]/20 text-[var(--terracotta)]";
  if (risk === "MODERATE RISK")
    return "border-[color:var(--golden-yellow)]/40 bg-[color:var(--golden-yellow)]/20 text-[var(--golden-yellow)]";
  return "border-[color:var(--leaf-green)]/40 bg-[color:var(--leaf-green)]/20 text-[var(--leaf-green)]";
}

function formatTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function getRiskFromApi(barangayName: string, apiRisks: Record<string, string>): RiskLevel {
  const found = apiRisks[barangayName];
  if (found === "EVACUATE NOW") return "EVACUATE NOW";
  if (found === "MODERATE RISK") return "MODERATE RISK";
  if (found === "SAFE") return "SAFE";
  return "SAFE";
}

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const [markers, setMarkers] = useState<MarkerData[]>(BASE_MARKERS);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [displayMarker, setDisplayMarker] = useState<MarkerData | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeRegion, setActiveRegion] = useState("All Regions");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<MapboxFeature[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [apiRisks, setApiRisks] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (selectedMarker) setDisplayMarker(selectedMarker);
  }, [selectedMarker]);

  // Fetch real risk levels from API
  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const res = await fetch("/api/barangay/risk");
        const data = await res.json();
        if (data.risks) {
          setApiRisks(data.risks);
          setLastUpdated(new Date());
          // Update markers with real risk levels
          setMarkers(prev =>
            prev.map(m => ({
              ...m,
              risk: getRiskFromApi(m.name, data.risks) ?? m.risk,
              timestamp: new Date().toISOString(),
            }))
          );
        }
      } catch {
        // keep seeded data on error
      }
    };
    fetchRisks();
    // Refresh every 5 minutes
    const id = setInterval(fetchRisks, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Update marker colors on map when risk levels change
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m, i) => {
      const markerData = markers[i];
      if (!markerData) return;
      const el = m.getElement();
      const core = el.querySelector(".kairago-pulse-core") as HTMLElement;
      const ring = el.querySelector(".kairago-pulse-ring") as HTMLElement;
      const color = RISK_COLORS[markerData.risk];
      if (core) core.style.backgroundColor = color;
      if (ring) ring.style.borderColor = color;
    });
  }, [markers]);

  // Mapbox search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?country=PH&types=locality,neighborhood,place&access_token=${token}&limit=5`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        setSearchSuggestions(data.features ?? []);
      } catch {
        // ignore
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        if (cancelled || !mapContainerRef.current) return;

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [122, 12],
          zoom: 5,
        });

        mapRef.current = map;

        map.on("load", () => {
          // Add heatmap source and layer
          map.addSource("risk-heatmap", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: BASE_MARKERS.map(m => ({
                type: "Feature",
                properties: {
                  weight: m.risk === "EVACUATE NOW" ? 1 : m.risk === "MODERATE RISK" ? 0.5 : 0.1,
                },
                geometry: { type: "Point", coordinates: [m.lng, m.lat] },
              })),
            },
          });

          map.addLayer({
            id: "risk-heatmap-layer",
            type: "heatmap",
            source: "risk-heatmap",
            layout: { visibility: "none" },
            paint: {
              "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
              "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
              "heatmap-color": [
                "interpolate", ["linear"], ["heatmap-density"],
                0, "rgba(74,222,128,0)",
                0.3, "rgba(74,222,128,0.6)",
                0.6, "rgba(245,158,11,0.8)",
                1, "rgba(239,68,68,1)",
              ],
              "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 20, 9, 60],
              "heatmap-opacity": 0.7,
            },
          });
        });

        // Add markers
        const newMarkers: any[] = [];
        for (const markerData of BASE_MARKERS) {
          const color = RISK_COLORS[markerData.risk];
          const wrapper = document.createElement("div");
          wrapper.className = "kairago-marker";

          const ring = document.createElement("div");
          ring.className = "kairago-pulse-ring";
          ring.style.borderColor = color;

          const core = document.createElement("div");
          core.className = "kairago-pulse-core";
          core.style.backgroundColor = color;

          wrapper.appendChild(ring);
          wrapper.appendChild(core);

          wrapper.addEventListener("click", (e) => {
            e.stopPropagation();
            setSelectedMarker(markerData);
            setShowFilter(false);
            setShowSearch(false);
          });

          const m = new mapboxgl.Marker({ element: wrapper, anchor: "center" })
            .setLngLat([markerData.lng, markerData.lat])
            .addTo(map);
          newMarkers.push(m);
        }
        markersRef.current = newMarkers;

      } catch {
        // silently ignore
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle heatmap toggle
  useEffect(() => {
    if (!mapRef.current) return;
    try {
      mapRef.current.setLayoutProperty(
        "risk-heatmap-layer",
        "visibility",
        showHeatmap ? "visible" : "none"
      );
    } catch {
      // layer not ready yet
    }
  }, [showHeatmap]);

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 13,
          duration: 1500,
        });

        // Try to fetch risk for user's location
        try {
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          if (!token) return;
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=locality,neighborhood&access_token=${token}`;
          const res = await fetch(url);
          const data = await res.json();
          const feature = data.features?.[0];
          if (feature) {
            // Add a user location marker
            const mapboxgl = (await import("mapbox-gl")).default;
            const el = document.createElement("div");
            el.style.cssText = `
              width: 20px; height: 20px; border-radius: 50%;
              background: #3B82F6; border: 3px solid white;
              box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
            `;
            new mapboxgl.Marker({ element: el })
              .setLngLat([longitude, latitude])
              .addTo(mapRef.current);
          }
        } catch {
          // ignore
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleRegionFilter = useCallback((region: string) => {
    setActiveRegion(region);
    setShowFilter(false);
    const bounds = REGION_BOUNDS[region];
    if (bounds && mapRef.current) {
      mapRef.current.flyTo({
        center: bounds.center,
        zoom: bounds.zoom,
        duration: 1200,
      });
    }
  }, []);

  const handleSearchSelect = useCallback(async (feature: MapboxFeature) => {
    setSearchQuery(feature.text);
    setSearchSuggestions([]);
    setShowSearch(false);
    mapRef.current?.flyTo({
      center: feature.center,
      zoom: 13,
      duration: 1200,
    });

    // Generate a bulletin for this searched location
    try {
      const res = await fetch("/api/bulletin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barangay_name: feature.text,
          coordinates: { lat: feature.center[1], lng: feature.center[0] },
        }),
      });
      const data = await res.json();
      if (data.risk_level) {
        const newMarker: MarkerData = {
          id: `search-${Date.now()}`,
          name: feature.text,
          region: feature.context?.find(c => c.id.startsWith("region"))?.text ?? "Philippines",
          lat: feature.center[1],
          lng: feature.center[0],
          risk: data.risk_level as RiskLevel,
          summary: data.bulletin_text?.slice(0, 120) + "..." ?? "Risk assessment generated.",
          bulletin: data.bulletin_text ?? "",
          sources: ["PAGASA", "NASA POWER", "NOAA"],
          confidence: data.confidence ?? "MODERATE",
          timestamp: new Date().toISOString(),
          peopleAffected: 0,
        };
        setMarkers(prev => [newMarker, ...prev]);
        setSelectedMarker(newMarker);

        // Add marker to map
        const mapboxgl = (await import("mapbox-gl")).default;
        const color = RISK_COLORS[newMarker.risk];
        const wrapper = document.createElement("div");
        wrapper.className = "kairago-marker";
        const ring = document.createElement("div");
        ring.className = "kairago-pulse-ring";
        ring.style.borderColor = color;
        const core = document.createElement("div");
        core.className = "kairago-pulse-core";
        core.style.backgroundColor = color;
        wrapper.appendChild(ring);
        wrapper.appendChild(core);
        wrapper.addEventListener("click", () => setSelectedMarker(newMarker));
        new mapboxgl.Marker({ element: wrapper, anchor: "center" })
          .setLngLat(feature.center)
          .addTo(mapRef.current);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    setSelectedMarker(null);
    setShowFullReport(false);
  }, []);

  const marker = displayMarker;

  return (
    <>
      <Header />

      <main
        className="relative mx-auto w-full max-w-[640px] overflow-hidden"
        style={{ height: "calc(100vh - 120px)", overflow: "hidden", background: "#0D1F15" }}
      >
        {/* Mapbox GL container */}
        <div
          ref={mapContainerRef}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", minHeight: "400px" }}
        />

        {/* ── Top controls row ── */}
        <div className="absolute left-4 right-4 top-4 z-10 flex items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex h-10 w-full items-center gap-2 rounded-lg border border-white/12 bg-[var(--surface-raised)] px-3 text-[13px] text-[var(--text-muted)] shadow-xl backdrop-blur-sm"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span>{searchQuery || "Search barangay..."}</span>
            </button>

            {showSearch && (
              <div className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-lg border border-white/12 bg-[var(--surface)] shadow-xl">
                <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2">
                  <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search any barangay..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-[14px] text-white placeholder-[var(--text-muted)] outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")}>
                      <X className="h-4 w-4 text-[var(--text-muted)]" />
                    </button>
                  )}
                </div>
                {searchSuggestions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSearchSelect(s)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] text-[var(--on-surface)] transition-colors hover:bg-white/5"
                  >
                    <Navigation className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                    <span>{s.place_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter button */}
          <button
            onClick={() => { setShowFilter(true); setSelectedMarker(null); setShowSearch(false); }}
            aria-label="Filter regions"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-[var(--surface-raised)] text-[var(--on-surface)] shadow-xl backdrop-blur-sm"
          >
            <ListFilter className="h-5 w-5" />
          </button>
        </div>

        {/* ── Right side controls ── */}
        <div className="absolute bottom-[220px] right-4 z-10 flex flex-col gap-2">
          {/* Zoom in */}
          <button
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/12 bg-[var(--surface-raised)] text-[var(--on-surface)] shadow-xl backdrop-blur-sm"
          >
            <Plus className="h-5 w-5" />
          </button>

          {/* Use my location */}
          <button
            onClick={handleUseMyLocation}
            aria-label="Use my location"
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg border border-white/12 bg-[var(--surface-raised)] shadow-xl backdrop-blur-sm",
              isLocating ? "text-[var(--leaf-green)]" : "text-[var(--on-surface)]"
            )}
          >
            <Navigation className={cn("h-5 w-5", isLocating && "animate-pulse")} />
          </button>

          {/* Heatmap toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            aria-label="Toggle heatmap"
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg border shadow-xl backdrop-blur-sm",
              showHeatmap
                ? "border-[color:var(--leaf-green)]/40 bg-[color:var(--leaf-green)]/20 text-[var(--leaf-green)]"
                : "border-white/12 bg-[var(--surface-raised)] text-[var(--on-surface)]"
            )}
          >
            <Layers className="h-5 w-5" />
          </button>
        </div>

        {/* ── Risk legend ── */}
        <div className="absolute bottom-[220px] left-4 z-10 flex flex-col gap-1.5 rounded-lg border border-white/12 bg-[var(--surface-raised)] px-3 py-2.5 shadow-xl backdrop-blur-sm">
          <p className="text-[9px] font-bold tracking-[0.12em] text-[var(--text-muted)]">RISK LEVEL</p>
          {(["SAFE", "MODERATE RISK", "EVACUATE NOW"] as RiskLevel[]).map(risk => (
            <div key={risk} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_COLORS[risk] }} />
              <span className="text-[10px] font-medium text-[var(--on-surface)]">{risk}</span>
            </div>
          ))}
          <p className="mt-1 text-[8px] text-[var(--text-muted)]">
            Updated {lastUpdated.toLocaleTimeString("en-PH", { timeStyle: "short" })}
          </p>
        </div>

        {/* Backdrop overlay */}
        {(selectedMarker !== null || showFilter || showSearch) && (
          <div
            className="absolute inset-0 z-20"
            onClick={() => {
              handleCloseBottomSheet();
              setShowFilter(false);
              setShowSearch(false);
            }}
          />
        )}

        {/* ── Marker info bottom sheet ── */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-30 rounded-t-[24px] border-t border-white/12 bg-[var(--surface)] shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-transform duration-300",
            selectedMarker ? "translate-y-0" : "translate-y-full pointer-events-none"
          )}
        >
          <div className="flex justify-center py-3">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          {marker && (
            <div className="px-6 pb-6">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="mb-0.5 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    {marker.region}
                  </p>
                  <h2 className="text-[22px] font-bold leading-tight text-white uppercase">
                    {marker.name}
                  </h2>
                </div>
                <div className={cn("shrink-0 rounded-full border px-2.5 py-1", riskBadgeClass(marker.risk))}>
                  <span className="text-[10px] font-medium uppercase">{marker.risk}</span>
                </div>
              </div>

              <div className={cn("mb-4 rounded-r-lg border-l-4 p-3", riskBorderClass(marker.risk), riskBgClass(marker.risk))}>
                <div className="mb-1.5 flex items-center gap-2">
                  <AlertTriangle className={cn("h-3.5 w-3.5 shrink-0", riskTextClass(marker.risk))} />
                  <span className={cn("text-[13px] font-bold", riskTextClass(marker.risk))}>{marker.risk}</span>
                </div>
                <p className="text-[13px] leading-[1.5] text-[color:var(--on-surface)]/90">{marker.summary}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-[var(--surface-raised)]">
                    <Users className="h-4 w-4 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-medium text-white">
                      {marker.peopleAffected ? marker.peopleAffected.toLocaleString() : "0"} AFFECTED
                    </span>
                    <span className="block text-[9px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                      PILOT DATA
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowFullReport(true)}
                  className="rounded-lg border border-white/12 bg-[var(--surface-raised)] px-3 py-2 text-[12px] font-medium text-[var(--on-surface)] transition-colors hover:bg-white/10"
                >
                  VIEW FULL REPORT
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Filter bottom sheet ── */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-30 rounded-t-[24px] border-t border-white/12 bg-[var(--surface)] shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-transform duration-300",
            showFilter ? "translate-y-0" : "translate-y-full pointer-events-none"
          )}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="text-[15px] font-bold text-white">Filter by Region</h3>
            <button
              onClick={() => setShowFilter(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-6 pb-8 flex flex-col gap-1">
            {REGIONS.map(region => (
              <button
                key={region}
                onClick={() => handleRegionFilter(region)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-4 py-3 text-[14px] font-medium transition-colors",
                  activeRegion === region
                    ? "bg-[color:var(--leaf-green)]/15 text-[var(--leaf-green)]"
                    : "text-[var(--on-surface)] hover:bg-white/5"
                )}
              ></button>