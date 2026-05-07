import {
  Activity,
  UserCircle,
  MapPin,
  TriangleAlert,
  CircleAlert,
  CircleCheck,
  ChevronRight,
} from "lucide-react";

export default function HistoryPage() {
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
        {/* Page Title & Location */}
        <div className="mb-6">
          <h1 className="mb-1 text-[24px] font-bold text-[var(--text-primary)]">
            BULLETIN HISTORY
          </h1>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-[18px] w-[18px] text-[var(--text-muted)]" />
            <span className="text-[15px] text-[var(--text-muted)]">
              San Roque, Marikina
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center justify-between border-b border-white/5">
          <button className="border-b-2 border-[var(--leaf-green)] px-2 py-3 text-[11px] font-medium tracking-[0.1em] text-[var(--leaf-green)]">
            ALL
          </button>
          {["HIGH", "MODERATE", "SAFE"].map((t) => (
            <button
              key={t}
              className="px-2 py-3 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)] transition-colors hover:text-[var(--on-surface)]"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Risk Pattern Chart Card */}
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
            {/* 30 bars, copied 1:1 from Stitch */}
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
        <div className="space-y-4">
          {/* Card 1: HIGH RISK */}
          <div className="overflow-hidden rounded-lg border border-white/10 border-l-4 border-l-[var(--terracotta)] bg-[var(--surface)] transition-all active:scale-95">
            <div className="flex items-start justify-between p-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    OCT 24 • 08:30 AM
                  </span>
                  <div className="flex items-center gap-1 text-[var(--terracotta)]">
                    <TriangleAlert className="h-[18px] w-[18px]" />
                    <span className="text-[13px] font-bold">HIGH RISK</span>
                  </div>
                </div>
                <p className="line-clamp-2 text-[15px] text-[var(--on-surface)]">
                  Extreme rainfall detected in upper Marikina basin. Evacuation
                  protocols initiated for Lowland San Roque.
                </p>
              </div>
              <ChevronRight className="ml-4 mt-6 h-5 w-5 text-[var(--text-muted)]" />
            </div>
          </div>

          {/* Card 2: MODERATE RISK */}
          <div className="overflow-hidden rounded-lg border border-white/10 border-l-4 border-l-[var(--golden-yellow)] bg-[var(--surface)] transition-all active:scale-95">
            <div className="flex items-start justify-between p-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    OCT 22 • 14:15 PM
                  </span>
                  <div className="flex items-center gap-1 text-[var(--golden-yellow)]">
                    <CircleAlert className="h-[18px] w-[18px]" />
                    <span className="text-[13px] font-bold">MODERATE</span>
                  </div>
                </div>
                <p className="line-clamp-2 text-[15px] text-[var(--on-surface)]">
                  Rising water levels observed at Sto. Niño station. General
                  advisory issued for riverbank communities.
                </p>
              </div>
              <ChevronRight className="ml-4 mt-6 h-5 w-5 text-[var(--text-muted)]" />
            </div>
          </div>

          {/* Card 3: SAFE */}
          <div className="overflow-hidden rounded-lg border border-white/10 border-l-4 border-l-[var(--leaf-green)] bg-[var(--surface)] transition-all active:scale-95">
            <div className="flex items-start justify-between p-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    OCT 20 • 09:00 AM
                  </span>
                  <div className="flex items-center gap-1 text-[var(--leaf-green)]">
                    <CircleCheck className="h-[18px] w-[18px]" />
                    <span className="text-[13px] font-bold">SAFE</span>
                  </div>
                </div>
                <p className="line-clamp-2 text-[15px] text-[var(--on-surface)]">
                  Weather conditions normalized. Water levels have subsided to
                  baseline levels. All warnings cleared.
                </p>
              </div>
              <ChevronRight className="ml-4 mt-6 h-5 w-5 text-[var(--text-muted)]" />
            </div>
          </div>

          {/* Card 4: HIGH RISK */}
          <div className="overflow-hidden rounded-lg border border-white/10 border-l-4 border-l-[var(--terracotta)] bg-[var(--surface)] transition-all active:scale-95">
            <div className="flex items-start justify-between p-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    OCT 15 • 19:45 PM
                  </span>
                  <div className="flex items-center gap-1 text-[var(--terracotta)]">
                    <TriangleAlert className="h-[18px] w-[18px]" />
                    <span className="text-[13px] font-bold">HIGH RISK</span>
                  </div>
                </div>
                <p className="line-clamp-2 text-[15px] text-[var(--on-surface)]">
                  Third alarm raised for Marikina River. Critical saturation
                  levels reached in San Roque residential zone.
                </p>
              </div>
              <ChevronRight className="ml-4 mt-6 h-5 w-5 text-[var(--text-muted)]" />
            </div>
          </div>

          {/* Card 5: MODERATE RISK */}
          <div className="overflow-hidden rounded-lg border border-white/10 border-l-4 border-l-[var(--golden-yellow)] bg-[var(--surface)] transition-all active:scale-95">
            <div className="flex items-start justify-between p-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    OCT 12 • 11:20 AM
                  </span>
                  <div className="flex items-center gap-1 text-[var(--golden-yellow)]">
                    <CircleAlert className="h-[18px] w-[18px]" />
                    <span className="text-[13px] font-bold">MODERATE</span>
                  </div>
                </div>
                <p className="line-clamp-2 text-[15px] text-[var(--on-surface)]">
                  Isolated thunderstorms expected. Minor street flooding
                  possible in low-lying barangays.
                </p>
              </div>
              <ChevronRight className="ml-4 mt-6 h-5 w-5 text-[var(--text-muted)]" />
            </div>
          </div>

          {/* Card 6: SAFE */}
          <div className="overflow-hidden rounded-lg border border-white/10 border-l-4 border-l-[var(--leaf-green)] bg-[var(--surface)] transition-all active:scale-95">
            <div className="flex items-start justify-between p-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    OCT 10 • 06:00 AM
                  </span>
                  <div className="flex items-center gap-1 text-[var(--leaf-green)]">
                    <CircleCheck className="h-[18px] w-[18px]" />
                    <span className="text-[13px] font-bold">SAFE</span>
                  </div>
                </div>
                <p className="line-clamp-2 text-[15px] text-[var(--on-surface)]">
                  Post-storm recovery update. River current stabilized.
                  Infrastructure safety inspection complete.
                </p>
              </div>
              <ChevronRight className="ml-4 mt-6 h-5 w-5 text-[var(--text-muted)]" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

