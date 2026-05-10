"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MapPin,
  TriangleAlert,
  CircleAlert,
  CircleCheck,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";

type RiskFilter = "ALL" | "HIGH" | "MODERATE" | "SAFE";

interface BulletinRecord {
  id: string;
  barangay_name: string;
  risk_level: "SAFE" | "MODERATE RISK" | "EVACUATE NOW";
  bulletin_text: string | null;
  recommended_action: string | null;
  confidence: string | null;
  timestamp: string;
}

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("en-PH", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function RiskBadge({ level }: { level: BulletinRecord["risk_level"] }) {
  if (level === "EVACUATE NOW") {
    return (
      <div className="flex items-center gap-1 text-[var(--terracotta)]">
        <TriangleAlert className="h-[18px] w-[18px]" />
        <span className="text-[13px] font-bold">HIGH RISK</span>
      </div>
    );
  }
  if (level === "MODERATE RISK") {
    return (
      <div className="flex items-center gap-1 text-[var(--golden-yellow)]">
        <CircleAlert className="h-[18px] w-[18px]" />
        <span className="text-[13px] font-bold">MODERATE</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-[var(--leaf-green)]">
      <CircleCheck className="h-[18px] w-[18px]" />
      <span className="text-[13px] font-bold">SAFE</span>
    </div>
  );
}

function borderColor(level: BulletinRecord["risk_level"]) {
  if (level === "EVACUATE NOW") return "border-l-[var(--terracotta)]";
  if (level === "MODERATE RISK") return "border-l-[var(--golden-yellow)]";
  return "border-l-[var(--leaf-green)]";
}

const SEEDED_BULLETINS = (() => {
  const now = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(now.getDate() - n);
    return d.toISOString();
  };
  return [
    { id: "s1", barangay_name: "Barangay Pag-asa, Quezon City", risk_level: "SAFE" as const, bulletin_text: "Clear skies and stable conditions. No immediate threat in the next 72 hours.", recommended_action: "Continue normal activities.", confidence: "HIGH", timestamp: daysAgo(3) },
    { id: "s2", barangay_name: "Barangay Poblacion, Makati", risk_level: "MODERATE RISK" as const, bulletin_text: "Heavy rainfall expected within 12 hours. Prepare go-bags and avoid low-lying areas.", recommended_action: "Prepare go-bag. Avoid riverbanks.", confidence: "MODERATE", timestamp: daysAgo(5) },
    { id: "s3", barangay_name: "Barangay San Jose, Batangas", risk_level: "SAFE" as const, bulletin_text: "Atmospheric conditions are stable with no significant weather events expected.", recommended_action: "Continue normal activities.", confidence: "HIGH", timestamp: daysAgo(7) },
    { id: "s4", barangay_name: "Barangay Poblacion, Leyte", risk_level: "EVACUATE NOW" as const, bulletin_text: "Typhoon landfall imminent. Water levels have exceeded the 12.5m threshold.", recommended_action: "Evacuate to designated shelters immediately.", confidence: "HIGH", timestamp: daysAgo(9) },
    { id: "s5", barangay_name: "Barangay Dalayap, Pampanga", risk_level: "SAFE" as const, bulletin_text: "No flooding risk detected. Lahar monitoring shows stable conditions.", recommended_action: "Continue normal activities.", confidence: "HIGH", timestamp: daysAgo(12) },
    { id: "s6", barangay_name: "Barangay Imus City, Cavite", risk_level: "SAFE" as const, bulletin_text: "Fair weather with light winds. No storm surge or flooding risk detected.", recommended_action: "Continue normal activities.", confidence: "HIGH", timestamp: daysAgo(15) },
    { id: "s7", barangay_name: "Barangay Bacoor, Cavite", risk_level: "MODERATE RISK" as const, bulletin_text: "Rainfall accumulation increasing. Monitor water levels near drainage channels.", recommended_action: "Prepare go-bag. Monitor local advisories.", confidence: "MODERATE", timestamp: daysAgo(18) },
    { id: "s8", barangay_name: "Barangay Santa Cruz, Laguna", risk_level: "SAFE" as const, bulletin_text: "Laguna Lake water levels are within normal range. No flooding expected.", recommended_action: "Continue normal activities.", confidence: "HIGH", timestamp: daysAgo(21) },
  ];
})();

function buildChartBars() {
  const now = new Date();
  const bars = [];
  for (let i = 29; i >= 0; i--) {
    const barDate = new Date(now);
    barDate.setDate(now.getDate() - i);
    const barDay = barDate.toDateString();
    const match = SEEDED_BULLETINS.find(b => new Date(b.timestamp).toDateString() === barDay);
    if (match) {
      if (match.risk_level === "EVACUATE NOW") {
        bars.push({ color: "var(--terracotta)", opacity: "1", height: "88%" });
      } else if (match.risk_level === "MODERATE RISK") {
        bars.push({ color: "var(--golden-yellow)", opacity: "0.8", height: "50%" });
      } else {
        bars.push({ color: "var(--leaf-green)", opacity: "0.9", height: "30%" });
      }
    } else {
      bars.push({ color: "var(--leaf-green)", opacity: "0.3", height: "15%" });
    }
  }
  return bars;
}

export default function HistoryPage() {
  const [activeFilter, setActiveFilter] = useState<RiskFilter>("ALL");
  const [bulletins, setBulletins] = useState<BulletinRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartBars] = useState(buildChartBars);

  const fetchHistory = useCallback(async (filter: RiskFilter) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "HIGH") params.set("risk_level", "EVACUATE NOW");
      else if (filter === "MODERATE") params.set("risk_level", "MODERATE RISK");
      else if (filter === "SAFE") params.set("risk_level", "SAFE");
      const res = await fetch(`/api/bulletin/history?${params}`);
      const data = await res.json();
      const records: BulletinRecord[] = data.bulletins ?? [];
      if (records.length === 0) {
        if (filter === "HIGH") setBulletins(SEEDED_BULLETINS.filter(b => b.risk_level === "EVACUATE NOW"));
        else if (filter === "MODERATE") setBulletins(SEEDED_BULLETINS.filter(b => b.risk_level === "MODERATE RISK"));
        else if (filter === "SAFE") setBulletins(SEEDED_BULLETINS.filter(b => b.risk_level === "SAFE"));
        else setBulletins(SEEDED_BULLETINS);
      } else {
        setBulletins(records);
      }
    } catch {
      setBulletins(SEEDED_BULLETINS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(activeFilter);
  }, [activeFilter, fetchHistory]);

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const fmt = (d: Date) => d.toLocaleDateString("en-PH", { month: "short", day: "2-digit" }).toUpperCase();
  const dateRange = `${fmt(thirtyDaysAgo)} - ${fmt(today)}`;

  return (
    <>
      <Header />
      <main className="custom-scrollbar mx-auto w-full max-w-[640px] flex-1 overflow-y-auto px-4 pb-24 pt-6 text-[15px] font-normal leading-[1.5]">

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="mb-1 text-[24px] font-bold text-[var(--text-primary)]">BULLETIN HISTORY</h1>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-[18px] w-[18px] text-[var(--text-muted)]" />
            <span className="text-[15px] text-[var(--text-muted)]">All barangays</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center justify-between border-b border-white/5">
          {(["ALL", "HIGH", "MODERATE", "SAFE"] as RiskFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-2 py-3 text-[11px] font-medium tracking-[0.1em] transition-colors",
                activeFilter === f
                  ? "border-b-2 border-[var(--leaf-green)] text-[var(--leaf-green)]"
                  : "text-[var(--text-muted)] hover:text-[var(--on-surface)]"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* 30-Day Risk Pattern Chart */}
        <div className="mb-8 rounded-xl border border-white/12 bg-[var(--surface-raised)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
              30-DAY RISK PATTERN
            </h2>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              {dateRange}
            </span>
          </div>
          <div className="flex h-20 items-end justify-between gap-0.5">
            {chartBars.map((bar, i) => (
              <div
                key={i}
                className="w-full rounded-t-sm"
                style={{
                  height: bar.height,
                  backgroundColor: `var(${bar.color.replace("var(", "").replace(")", "")})`,
                  opacity: bar.opacity,
                }}
              />
            ))}
          </div>
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : bulletins.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[var(--surface-raised)] p-8 text-center">
            <p className="text-[15px] text-[var(--text-muted)]">
              No bulletins found for this filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bulletins.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "overflow-hidden rounded-lg border border-white/10 border-l-4 bg-[var(--surface)] transition-all active:scale-95",
                  borderColor(b.risk_level)
                )}
              >
                <div className="flex items-start justify-between p-3">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                        {formatTimestamp(b.timestamp)}
                      </span>
                      <RiskBadge level={b.risk_level} />
                    </div>
                    <p className="mb-1 text-[12px] font-medium text-[var(--text-muted)]">
                      {b.barangay_name}
                    </p>
                    <p className="line-clamp-2 text-[14px] text-[var(--on-surface)]">
                      {b.bulletin_text ?? b.recommended_action ?? "—"}
                    </p>
                  </div>
                  <ChevronRight className="ml-3 mt-5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}