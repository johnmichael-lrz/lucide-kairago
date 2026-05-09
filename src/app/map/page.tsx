"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, ListFilter, X, AlertTriangle, Users, ChevronDown } from "lucide-react";
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
}

const MARKERS: MarkerData[] = [
  {
    id: "pagasa-qc",
    name: "Barangay Pag-asa",
    region: "Quezon City, NCR",
    lat: 14.6563,
    lng: 121.0322,
    risk: "SAFE",
    summary: "Clear skies and stable conditions. No immediate threat to your community in the next 72 hours.",
    bulletin:
      "Current atmospheric conditions indicate no immediate threat of flooding or severe weather in Barangay Pag-asa. Satellite data shows clear skies with minimal cloud formation. Local sensors report stable water levels across all primary monitoring stations in Quezon City.",
    sources: ["PAGASA", "NASA POWER", "NOAA"],
    confidence: "HIGH",
    timestamp: "2026-05-09T08:00:00+08:00",
  },
  {
    id: "poblacion-makati",
    name: "Barangay Poblacion",
    region: "Makati City, NCR",
    lat: 14.5547,
    lng: 121.0244,
    risk: "MODERATE RISK",
    summary: "Heavy rainfall expected in 12 hours. Your community should prepare go-bags and avoid low-lying areas.",
    bulletin:
      "A sustained band of heavy rainfall is tracking toward the Makati watershed. Runoff is expected to increase rapidly, with a high likelihood of street-level flooding in low-lying zones and near-channel communities within the next 6–12 hours.",
    sources: ["PAGASA", "NASA POWER", "NOAA"],
    confidence: "MODERATE",
    timestamp: "2026-05-09T08:00:00+08:00",
  },
  {
    id: "sanjose-batangas",
    name: "Barangay San Jose",
    region: "Batangas City, Region IV-A",
    lat: 13.7565,
    lng: 121.0583,
    risk: "SAFE",
    summary: "Conditions are stable. No significant weather events are expected in your community for the next 72 hours.",
    bulletin:
      "Atmospheric data for Barangay San Jose shows stable pressure systems and low rainfall probability. Wind speeds remain within safe thresholds. No typhoon activity has been detected within 500 km of your community.",
    sources: ["PAGASA", "NASA POWER"],
    confidence: "HIGH",
    timestamp: "2026-05-09T08:00:00+08:00",
  },
  {
    id: "poblacion-leyte",
    name: "Barangay Poblacion",
    region: "Leyte, Region VIII",
    lat: 11.2442,
    lng: 124.9997,
    risk: "EVACUATE NOW",
    summary: "Typhoon landfall imminent. Your community must evacuate immediately to designated shelters.",
    bulletin:
      "Typhoon landfall is imminent in Barangay Poblacion. Forecast models indicate destructive winds exceeding 150 kph and rapid surge in rainfall intensity. Water levels have exceeded the 12.5 m threshold. If your community is within flood-prone areas, coastal zones, or near steep slopes, evacuate immediately to designated shelters and avoid all waterways.",
    sources: ["PAGASA", "NASA POWER", "NOAA", "PHIVOLCS"],
    confidence: "HIGH",
    timestamp: "2026-05-09T08:00:00+08:00",
  },
  {
    id: "pagasa-palawan",
    name: "Barangay Pag-asa",
    region: "Puerto Princesa, Palawan",
    lat: 9.8395,
    lng: 118.7367,
    risk: "SAFE",
    summary: "Fair weather prevails. Seas are calm and no weather disturbance is detected near your community.",
    bulletin:
      "Environmental monitoring for Barangay Pag-asa in Palawan shows favorable conditions. Sea surface temperatures are normal and no tropical disturbance has been detected in the vicinity. Your community can expect clear weather for the next 72 hours.",
    sources: ["PAGASA", "NOAA"],
    confidence: "HIGH",
    timestamp: "2026-05-09T08:00:00+08:00",
  },
];

const RISK_COLORS: Record<RiskLevel, string> = {
  SAFE: "#4ADE80",
  "MODERATE RISK": "#F59E0B",
  "EVACUATE NOW": "#EF4444",
};

const REGIONS = ["All Regions", "NCR", "Region III", "Region IV-A", "Visayas", "Mindanao"];

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

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  // Keep last-shown marker so bottom sheet content doesn't vanish during close animation
  const [displayMarker, setDisplayMarker] = useState<MarkerData | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [activeRegion, setActiveRegion] = useState("All Regions");

  useEffect(() => {
    if (selectedMarker) setDisplayMarker(selectedMarker);
  }, [selectedMarker]);

  // Initialise Mapbox map
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

        // Add pulsing markers
        for (const markerData of MARKERS) {
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
          });

          new mapboxgl.Marker({ element: wrapper, anchor: "center" })
            .setLngLat([markerData.lng, markerData.lat])
            .addTo(map);
        }
      } catch {
        // map init failed — silently ignore (e.g. no token)
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

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    setSelectedMarker(null);
    setShowFullReport(false);
  }, []);

  const handleCloseFilter = useCallback(() => {
    setShowFilter(false);
  }, []);

  const marker = displayMarker;

  return (
    <>
      <Header />

      <main
        className="relative mx-auto w-full max-w-[640px] overflow-hidden"
        style={{ height: "calc(100vh - 120px)" }}
      >
        {/* Mapbox GL container */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {/* Floating + zoom button */}
        <div className="absolute bottom-[210px] right-4 z-10 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/12 bg-[var(--surface-raised)] text-[var(--on-surface)] shadow-xl backdrop-blur-sm"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Filter button */}
        <button
          onClick={() => {
            setShowFilter(true);
            setSelectedMarker(null);
          }}
          aria-label="Filter regions"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-[var(--surface-raised)] text-[var(--on-surface)] shadow-xl backdrop-blur-sm"
        >
          <ListFilter className="h-5 w-5" />
        </button>

        {/* Backdrop overlay — closes whichever sheet is open */}
        {(selectedMarker !== null || showFilter) && (
          <div
            className="absolute inset-0 z-20"
            onClick={() => {
              handleCloseBottomSheet();
              handleCloseFilter();
            }}
          />
        )}

        {/* ── Marker info bottom sheet ─────────────────────────────────────── */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-30 rounded-t-[24px] border-t border-white/12 bg-[var(--surface)] shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-transform duration-300",
            selectedMarker ? "translate-y-0" : "translate-y-full pointer-events-none"
          )}
        >
          {/* Drag handle */}
          <div className="flex justify-center py-3">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          {marker && (
            <div className="px-6 pb-8">
              {/* Header row */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    {marker.region}
                  </p>
                  <h2 className="text-[26px] font-bold leading-tight text-white uppercase">
                    {marker.name}
                  </h2>
                </div>
                <div
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1",
                    riskBadgeClass(marker.risk)
                  )}
                >
                  <span className="text-[11px] font-medium uppercase">{marker.risk}</span>
                </div>
              </div>

              {/* Bulletin summary */}
              <div
                className={cn(
                  "mb-5 rounded-r-lg border-l-4 p-4",
                  riskBorderClass(marker.risk),
                  riskBgClass(marker.risk)
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className={cn("h-4 w-4 shrink-0", riskTextClass(marker.risk))} />
                  <span className={cn("text-[14px] font-bold", riskTextClass(marker.risk))}>
                    {marker.risk}
                  </span>
                </div>
                <p className="text-[14px] leading-[1.5] text-[color:var(--on-surface)]/90">
                  {marker.summary}
                </p>
              </div>

              {/* Data row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-[var(--surface-raised)]">
                    <Users className="h-5 w-5 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <span className="block text-[15px] font-medium text-white">
                      1,240 PEOPLE AFFECTED
                    </span>
                    <span className="block text-[10px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                      PILOT DATA
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowFullReport(true)}
                  className="rounded-lg border border-white/12 bg-[var(--surface-raised)] px-4 py-2 text-[13px] font-medium text-[var(--on-surface)] transition-colors hover:bg-white/10"
                >
                  VIEW FULL REPORT
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Filter bottom sheet ──────────────────────────────────────────── */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-30 rounded-t-[24px] border-t border-white/12 bg-[var(--surface)] shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-transform duration-300",
            showFilter ? "translate-y-0" : "translate-y-full pointer-events-none"
          )}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="text-[15px] font-bold text-white">Filter by Region</h3>
            <button
              onClick={handleCloseFilter}
              aria-label="Close filter"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-6 pb-8 flex flex-col gap-1">
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => {
                  setActiveRegion(region);
                  setShowFilter(false);
                }}
                className={cn(
                  "flex items-center justify-between rounded-lg px-4 py-3 text-[14px] font-medium transition-colors",
                  activeRegion === region
                    ? "bg-[color:var(--leaf-green)]/15 text-[var(--leaf-green)]"
                    : "text-[var(--on-surface)] hover:bg-white/5"
                )}
              >
                {region}
                {activeRegion === region && (
                  <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Full report modal ────────────────────────────────────────────── */}
        {showFullReport && marker && (
          <div
            className="absolute inset-0 z-40 flex items-end bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFullReport(false)}
          >
            <div
              className="w-full rounded-t-[24px] border-t border-white/12 bg-[var(--surface)] shadow-[0_-8px_40px_rgba(0,0,0,0.7)] max-h-[85%] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="h-1 w-10 rounded-full bg-white/20" />
              </div>

              <div className="px-6 pb-10">
                {/* Title */}
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                      FULL BULLETIN REPORT
                    </p>
                    <h2 className="text-[22px] font-bold text-white uppercase">{marker.name}</h2>
                    <p className="text-[13px] text-[var(--text-muted)]">{marker.region}</p>
                  </div>
                  <button
                    onClick={() => setShowFullReport(false)}
                    aria-label="Close report"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Risk badge */}
                <div
                  className={cn(
                    "mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1",
                    riskBadgeClass(marker.risk)
                  )}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em]">
                    {marker.risk}
                  </span>
                </div>

                {/* Bulletin text */}
                <div className="mb-5">
                  <p className="mb-2 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    BULLETIN TEXT
                  </p>
                  <p className="text-[15px] leading-[1.6] text-[var(--text-body)]">
                    {marker.bulletin}
                  </p>
                </div>

                {/* Confidence */}
                <div className="mb-5 flex items-center gap-3 rounded-lg border border-white/8 bg-[var(--surface-raised)] px-4 py-3">
                  <div>
                    <p className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                      CONFIDENCE SCORE
                    </p>
                    <p className="text-[17px] font-bold text-white">{marker.confidence}</p>
                  </div>
                </div>

                {/* Data sources */}
                <div className="mb-5">
                  <p className="mb-2 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    DATA SOURCES
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {marker.sources.map((src) => (
                      <div
                        key={src}
                        className="rounded border border-white/10 bg-white/5 px-3 py-1"
                      >
                        <span className="text-[11px] font-bold text-[var(--text-muted)]">{src}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timestamp */}
                <div>
                  <p className="mb-1 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    GENERATED AT
                  </p>
                  <p className="text-[13px] text-[var(--on-surface)]">
                    {formatTimestamp(marker.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}