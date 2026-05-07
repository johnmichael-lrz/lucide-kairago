"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  UserCircle,
  MapPin,
  TriangleAlert,
  CircleAlert,
  CircleCheck,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      if (filter !== "ALL") params.set("risk_level", filter);
      const res = await fetch(`/api/bulletin/history?${params}`);
      const data = await res.json();
      const records: BulletinRecord[] = data.bulletins ?? [];
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
      {/* Top AppBar */}
      <header className="z-50 border-b border-white/10 bg-[var(--surface)]">
        <div className="mx-auto flex h-14 w-full max-w-[640px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-[var(--primary)]" />
            <span className="tracking-tight text-[24px] font-bold text-[var(--on-surface)]">
              Kairago
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-[var(--primary)]" />
          </div>
        </div>
      </header>

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
              OCT 01 - OCT 30
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
