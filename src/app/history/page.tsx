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

export default function HistoryPage() {
  const [activeFilter, setActiveFilter] = useState<RiskFilter>("ALL");
  const [bulletins, setBulletins] = useState<BulletinRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

  const fetchHistory = useCallback(async (filter: RiskFilter) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "HIGH") params.set("risk_level", "EVACUATE NOW");
else if (filter === "MODERATE") params.set("risk_level", "MODERATE RISK");
else if (filter === "SAFE") params.set("risk_level", "SAFE");
const records: BulletinRecord[] = data.bulletins ?? [];
if (records.length === 0) {
  const now = new Date();
  const daysAgo = (n: number) => { const d = new Date(now); d.setDate(now.getDate() - n); return d.toISOString(); };
  const seeded: BulletinRecord[] = [
    { id: "s1", barangay_name: "Barangay Pag-asa, Quezon City", risk_level: "SAFE", bulletin_text: "Clear skies and stable conditions. No immediate threat in the next 72 hours.", recommended_action: "Continue normal activities.", confidence: "HIGH", timestamp: daysAgo(3) },
    { id: "s2", barangay_name: "Barangay Poblacion, Makati", risk_level: "MODERATE RISK", bulletin_text: "Heavy rainfall expected within 12 hours. Prepare go-bags and avoid low-lying areas.", recommended_action: "Prepare go-bag. Avoid riverbanks.", confidence: "MODERATE", timestamp: daysAgo(5) },
    { id: "s3", barangay_name: "Barangay San Jose, Batangas", risk_level: "SAFE", bulletin_text: "Atmospheric conditions are stable with no significant weather events expected.", recommended_action: "Continue normal activities.", confidence: "HIGH", timestamp: daysAgo(7) },
    { id: "s4", barangay_name: "Barangay Poblacion, Leyte", risk_level: "EVACUATE NOW", bulletin_text: "Typhoon landfall imminent. Water levels have exceeded the 12.5m threshold.", recommended_action: "Evacuate to designated shelters immediately.", confidence: "HIGH", timestamp: daysAgo(9) },
    { id: "s5", barangay_name: "Barangay Dalayap, Pampanga", risk_level: "SAFE", bulletin_text: "No flooding risk detected. Lahar monitoring shows stable conditions.", recommended_action: "Continue normal activities.", confidence: "HIGH", timestamp: daysAgo(12) },
    { id: "s6", barangay_name: "Barangay Imus City, Cavite", risk_level: "SAFE", bulletin_text: "Fair weather with light winds. No storm surge or flooding risk detected.", recommended_action: "Continue normal activities.", confidence: "HIGH", timestamp: daysAgo(15) },
    { id: "s7", barangay_name: "Barangay Bacoor, Cavite", risk_level: "MODERATE RISK", bulletin_text: "Rainfall accumulation increasing. Monitor water levels near drainage channels.", recommended_action: "Prepare go-bag. Monitor local advisories.", confidence: "MODERATE", timestamp: daysAgo(18) },
    { id: "s8", barangay_name: "Barangay Santa Cruz, Laguna", risk_level: "SAFE", bulletin_text: "Laguna Lake water levels are within normal range. No flooding expected.", recommended_action: "Continue normal activities.", confidence: "HIGH", timestamp: daysAgo(21) },
      ];
      if (filter === "HIGH") setBulletins(seeded.filter(b => b.risk_level === "EVACUATE NOW"));
      else if (filter === "MODERATE") setBulletins(seeded.filter(b => b.risk_level === "MODERATE RISK"));
      else if (filter === "SAFE") setBulletins(seeded.filter(b => b.risk_level === "SAFE"));
      else setBulletins(seeded);
      setIsEmpty(false);
    } else {
      setBulletins(records);
      setIsEmpty(false);
    }

      setBulletins(records);
      setIsEmpty(records.length === 0);
    } catch {
      setBulletins([]);
      setIsEmpty(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(activeFilter);
  }, [activeFilter, fetchHistory]);

  const handleFilter = (filter: RiskFilter) => {
    setActiveFilter(filter);
  };

  return (
    <>
      <Header />

      <main className="custom-scrollbar mx-auto w-full max-w-[640px] flex-1 overflow-y-auto px-4 pb-24 pt-6 text-[15px] font-normal leading-[1.5]">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="mb-1 text-[24px] font-bold text-[var(--text-primary)]">
            BULLETIN HISTORY
          </h1>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-[18px] w-[18px] text-[var(--text-muted)]" />
            <span className="text-[15px] text-[var(--text-muted)]">
              All barangays
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center justify-between border-b border-white/5">
          {(["ALL", "HIGH", "MODERATE", "SAFE"] as RiskFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
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

        {/* Risk Pattern Chart (static visual) */}
        <div className="mb-8 rounded-xl border border-white/12 bg-[var(--surface-raised)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
              30-DAY RISK PATTERN
            </h2>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">
            {(() => { const t = new Date(); const a = new Date(t); a.setDate(t.getDate() - 30); const f = (d: Date) => d.toLocaleDateString("en-PH", { month: "short", day: "2-digit" }).toUpperCase(); return `${f(a)} - ${f(t)}`; })()} 
            </span>
          </div>
          <div className="flex h-20 items-end justify-between gap-0.5">
            <div className="h-[20%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[15%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[18%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[22%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[45%] w-full rounded-t-sm bg-[var(--golden-yellow)] opacity-80" />
            <div className="h-[40%] w-full rounded-t-sm bg-[var(--golden-yellow)] opacity-80" />
            <div className="h-[25%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[15%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[18%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[75%] w-full rounded-t-sm bg-[var(--terracotta)]" />
            <div className="h-[85%] w-full rounded-t-sm bg-[var(--terracotta)]" />
            <div className="h-[55%] w-full rounded-t-sm bg-[var(--golden-yellow)] opacity-80" />
            <div className="h-[50%] w-full rounded-t-sm bg-[var(--golden-yellow)] opacity-80" />
            <div className="h-[25%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[90%] w-full rounded-t-sm bg-[var(--terracotta)]" />
            <div className="h-[80%] w-full rounded-t-sm bg-[var(--terracotta)]" />
            <div className="h-[45%] w-full rounded-t-sm bg-[var(--golden-yellow)] opacity-80" />
            <div className="h-[20%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[15%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[12%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[10%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[40%] w-full rounded-t-sm bg-[var(--golden-yellow)] opacity-80" />
            <div className="h-[48%] w-full rounded-t-sm bg-[var(--golden-yellow)] opacity-80" />
            <div className="h-[82%] w-full rounded-t-sm bg-[var(--terracotta)]" />
            <div className="h-[88%] w-full rounded-t-sm bg-[var(--terracotta)]" />
            <div className="h-[52%] w-full rounded-t-sm bg-[var(--golden-yellow)] opacity-80" />
            <div className="h-[30%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[22%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[15%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
            <div className="h-[10%] w-full rounded-t-sm bg-[var(--leaf-green)] opacity-60" />
          </div>
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : isEmpty ? (
          <div className="rounded-xl border border-white/10 bg-[var(--surface-raised)] p-8 text-center">
            <p className="text-[15px] text-[var(--text-muted)]">
              No bulletins yet. Search for a barangay on the home screen to
              generate your first bulletin.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bulletins.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "overflow-hidden rounded-lg border border-white/10 border-l-4 bg-[var(--surface)] transition-all active:scale-95",
                  borderColor(b.risk_level)
                )}
              >
                <div className="flex items-start justify-between p-4">
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
                    <p className="line-clamp-2 text-[15px] text-[var(--on-surface)]">
                      {b.bulletin_text ?? b.recommended_action ?? "—"}
                    </p>
                  </div>
                  <ChevronRight className="ml-4 mt-6 h-5 w-5 shrink-0 text-[var(--text-muted)]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
