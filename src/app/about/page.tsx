import {
  Cloud,
  Globe,
  Waves,
  Thermometer,
  Terminal,
} from "lucide-react";
import { Header } from "@/components/Header";

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-screen-sm flex-grow px-4 pb-24">
        {/* Hero Section */}
        <section className="mb-10 mt-8">
          <h1 className="mb-1 text-[24px] font-bold text-[var(--leaf-green)]">
            ABOUT KAIRAGO
          </h1>
          <p className="mb-4 text-[20px] font-normal leading-tight text-[var(--text-primary)]">
            Intelligence at the critical moment
          </p>

          {/* Philippine SVG Map — replaces AI globe image */}
          <div className="tonal-border relative mb-6 w-full overflow-hidden rounded-xl bg-[#0D1F15]" style={{ height: "220px" }}>
            <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
              {/* Island outlines — simplified */}
              <ellipse cx="220" cy="75" rx="18" ry="30" fill="none" stroke="#2D4A3E" strokeWidth="1.5" />
              <ellipse cx="235" cy="118" rx="12" ry="22" fill="none" stroke="#2D4A3E" strokeWidth="1.5" />
              <ellipse cx="212" cy="138" rx="10" ry="18" fill="none" stroke="#2D4A3E" strokeWidth="1.5" />
              <ellipse cx="196" cy="88" rx="8" ry="14" fill="none" stroke="#2D4A3E" strokeWidth="1.5" />
              <ellipse cx="242" cy="153" rx="14" ry="20" fill="none" stroke="#2D4A3E" strokeWidth="1.5" />
              <ellipse cx="202" cy="163" rx="10" ry="14" fill="none" stroke="#2D4A3E" strokeWidth="1.5" />
              <ellipse cx="162" cy="128" rx="9" ry="16" fill="none" stroke="#2D4A3E" strokeWidth="1.5" />

              {/* Connection lines */}
              <line x1="220" y1="75" x2="235" y2="118" stroke="#4ADE80" strokeWidth="0.5" strokeOpacity="0.3" />
              <line x1="235" y1="118" x2="242" y2="153" stroke="#4ADE80" strokeWidth="0.5" strokeOpacity="0.3" />
              <line x1="220" y1="75" x2="196" y2="88" stroke="#4ADE80" strokeWidth="0.5" strokeOpacity="0.3" />
              <line x1="212" y1="138" x2="202" y2="163" stroke="#4ADE80" strokeWidth="0.5" strokeOpacity="0.3" />
              <line x1="162" y1="128" x2="212" y2="138" stroke="#4ADE80" strokeWidth="0.5" strokeOpacity="0.3" />
              <line x1="220" y1="75" x2="162" y2="128" stroke="#4ADE80" strokeWidth="0.5" strokeOpacity="0.2" />

              {/* Marker — Luzon (SAFE) */}
              <circle cx="220" cy="75" r="6" fill="#4ADE80" opacity="0.9" />
              <circle cx="220" cy="75" r="6" fill="none" stroke="#4ADE80" strokeWidth="2">
                <animate attributeName="r" from="6" to="18" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.8" to="0" dur="1.8s" repeatCount="indefinite" />
              </circle>

              {/* Marker — Visayas (MODERATE RISK) */}
              <circle cx="235" cy="132" r="6" fill="#F59E0B" opacity="0.9" />
              <circle cx="235" cy="132" r="6" fill="none" stroke="#F59E0B" strokeWidth="2">
                <animate attributeName="r" from="6" to="18" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
              </circle>

              {/* Marker — Leyte (EVACUATE NOW) */}
              <circle cx="252" cy="153" r="6" fill="#EF4444" opacity="0.9" />
              <circle cx="252" cy="153" r="6" fill="none" stroke="#EF4444" strokeWidth="2">
                <animate attributeName="r" from="6" to="18" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>

              {/* Marker — Palawan (SAFE) */}
              <circle cx="162" cy="128" r="6" fill="#4ADE80" opacity="0.9" />
              <circle cx="162" cy="128" r="6" fill="none" stroke="#4ADE80" strokeWidth="2">
                <animate attributeName="r" from="6" to="18" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.8" to="0" dur="2.2s" repeatCount="indefinite" />
              </circle>

              {/* Marker — Mindanao (SAFE) */}
              <circle cx="222" cy="188" r="6" fill="#4ADE80" opacity="0.9" />
              <circle cx="222" cy="188" r="6" fill="none" stroke="#4ADE80" strokeWidth="2">
                <animate attributeName="r" from="6" to="18" dur="1.9s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.8" to="0" dur="1.9s" repeatCount="indefinite" />
              </circle>

              {/* Labels */}
              <text x="228" y="71" fill="#4ADE80" fontSize="8" fontFamily="sans-serif" opacity="0.8">Luzon</text>
              <text x="240" y="129" fill="#F59E0B" fontSize="8" fontFamily="sans-serif" opacity="0.8">Visayas</text>
              <text x="257" y="150" fill="#EF4444" fontSize="8" fontFamily="sans-serif" opacity="0.8">Leyte</text>
              <text x="118" y="126" fill="#4ADE80" fontSize="8" fontFamily="sans-serif" opacity="0.8">Palawan</text>
              <text x="224" y="202" fill="#4ADE80" fontSize="8" fontFamily="sans-serif" opacity="0.8">Mindanao</text>

              {/* Legend */}
              <circle cx="22" cy="16" r="4" fill="#4ADE80" />
              <text x="30" y="20" fill="#4ADE80" fontSize="7" fontFamily="sans-serif" opacity="0.7">SAFE</text>
              <circle cx="22" cy="30" r="4" fill="#F59E0B" />
              <text x="30" y="34" fill="#F59E0B" fontSize="7" fontFamily="sans-serif" opacity="0.7">MODERATE RISK</text>
              <circle cx="22" cy="44" r="4" fill="#EF4444" />
              <text x="30" y="48" fill="#EF4444" fontSize="7" fontFamily="sans-serif" opacity="0.7">EVACUATE NOW</text>
            </svg>
          </div>

          <p className="text-[15px] font-normal leading-[1.5] text-[var(--text-body)]">
            Kairago serves as a vital intelligence bridge, translating national
            scientific weather data into actionable local insights. We operate
            at the intersection of risk and readiness, ensuring that critical
            warnings reach the barangay level before the moment of impact.
          </p>
        </section>

        {/* Real-Time Data Sources */}
        <section className="mb-10">
          <h2 className="mb-4 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
            REAL-TIME DATA SOURCES
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="tonal-border rounded-xl bg-[var(--surface)] p-4">
              <div className="mb-3 flex items-start justify-between">
                <Cloud className="h-5 w-5 text-[var(--leaf-green)]" />
                <div className="h-2 w-2 rounded-full bg-[var(--leaf-green)]" />
              </div>
              <h3 className="mb-1 text-[17px] font-bold text-[var(--text-primary)]">PAGASA</h3>
              <p className="text-[13px] font-normal text-[var(--text-muted)]">
                Local atmospheric patterns and tropical cyclone tracking.
              </p>
            </div>

            <div className="tonal-border rounded-xl bg-[var(--surface)] p-4">
              <div className="mb-3 flex items-start justify-between">
                <Globe className="h-5 w-5 text-[var(--leaf-green)]" />
                <div className="h-2 w-2 rounded-full bg-[var(--leaf-green)]" />
              </div>
              <h3 className="mb-1 text-[17px] font-bold text-[var(--text-primary)]">NASA POWER</h3>
              <p className="text-[13px] font-normal text-[var(--text-muted)]">
                Global climatology data and solar radiation monitoring.
              </p>
            </div>

            <div className="tonal-border rounded-xl bg-[var(--surface)] p-4">
              <div className="mb-3 flex items-start justify-between">
                <Waves className="h-5 w-5 text-[var(--leaf-green)]" />
                <div className="h-2 w-2 rounded-full bg-[var(--leaf-green)]" />
              </div>
              <h3 className="mb-1 text-[17px] font-bold text-[var(--text-primary)]">NOAA</h3>
              <p className="text-[13px] font-normal text-[var(--text-muted)]">
                Oceanic disturbances and oceanic-atmospheric shifts.
              </p>
            </div>

            <div className="tonal-border rounded-xl bg-[var(--surface)] p-4">
              <div className="mb-3 flex items-start justify-between">
                <Thermometer className="h-5 w-5 text-[var(--leaf-green)]" />
                <div className="h-2 w-2 rounded-full bg-[var(--leaf-green)]" />
              </div>
              <h3 className="mb-1 text-[17px] font-bold text-[var(--text-primary)]">PHIVOLCS</h3>
              <p className="text-[13px] font-normal text-[var(--text-muted)]">
                Seismic activity and volcanic threat assessments.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-10">
          <h2 className="mb-4 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
            HOW IT WORKS
          </h2>
          <div className="space-y-3">
            {[
              {
                step: "1",
                title: "Continuous Ingestion",
                body: "Environmental data fetched from PAGASA, NASA POWER, NOAA, and PHIVOLCS on each bulletin request.",
              },
              {
                step: "2",
                title: "AI Synthesis",
                body: "Patterns are analyzed against historical local impact data.",
              },
              {
                step: "3",
                title: "Direct Bulletins",
                body: "Localized risk assessments pushed directly to your device.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="tonal-border flex items-center gap-4 rounded-lg bg-[var(--surface-raised)] p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[var(--surface)] font-bold text-[var(--leaf-green)]">
                  {item.step}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">{item.title}</h4>
                  <p className="text-[13px] font-normal text-[var(--text-muted)]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Built at CodeKada */}
        <section className="mb-12">
          <h2 className="mb-4 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
            BUILT AT CODEKADA 2026
          </h2>
          <div className="tonal-border rounded-xl bg-[var(--surface)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--terracotta)]">
                <Terminal className="h-4 w-4 text-white" />
              </div>
              <p className="text-[15px] font-normal leading-[1.5] text-[var(--text-body)]">
                Engineered during the 2026 CodeKada hackathon to address climate
                resilience in vulnerable regions.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-[var(--leaf-green)]">
                LICENSE: MIT
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-[var(--text-muted)]">
                V1.0.0-BETA
              </span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}