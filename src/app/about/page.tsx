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

      {/* Main Content Canvas */}
      <main className="mx-auto w-full max-w-screen-sm flex-grow px-4 pb-24">
        {/* Hero Section: About Kairago */}
        <section className="mb-10 mt-8">
          <h1 className="mb-1 text-[24px] font-bold text-[var(--leaf-green)]">
            ABOUT KAIRAGO
          </h1>
          <p className="mb-4 text-[20px] font-normal leading-tight text-[var(--text-primary)]">
            Intelligence at the critical moment
          </p>
          <div className="tonal-border relative mb-6 aspect-video w-full overflow-hidden rounded-xl">
            <img
              className="h-full w-full object-cover opacity-60"
              alt="A high-tech digital visualization of atmospheric data flowing across a dark globe."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6F-CPTPtuRxuWXPuIsTelE1s264Zv6-qRYoUtKU8-j2LBeWKB5dZCT2yR6ttyioI81XrI_ecVdVeglyDctV-Q76CpO7OozHdWTzQfOPanPkR7pebMFmJRT7IeIlmXM38bHx0PbUTTyFtA_H6filxhlB1gH3dXFKmba2KqNkYuFpflhXyzue46RZmOKcITfCAgeyMF1-H02CfcUnrINX6CcNbgt6UA1g_cfDGPBd0KMWNTpL_upkZWgy8CiePxzMJRqQRF1fUE1xaR"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] to-transparent" />
          </div>
          <p className="text-[15px] font-normal leading-[1.5] text-[var(--text-body)]">
            Kairago serves as a vital intelligence bridge, translating national
            scientific weather data into actionable local insights. We operate
            at the intersection of risk and readiness, ensuring that critical
            warnings reach the barangay level before the moment of impact.
          </p>
        </section>

        {/* Real-Time Data Sources: 2x2 Bento Grid */}
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
              <h3 className="mb-1 text-[17px] font-bold text-[var(--text-primary)]">
                PAGASA
              </h3>
              <p className="text-[13px] font-normal text-[var(--text-muted)]">
                Local atmospheric patterns and tropical cyclone tracking.
              </p>
            </div>

            <div className="tonal-border rounded-xl bg-[var(--surface)] p-4">
              <div className="mb-3 flex items-start justify-between">
                <Globe className="h-5 w-5 text-[var(--leaf-green)]" />
                <div className="h-2 w-2 rounded-full bg-[var(--leaf-green)]" />
              </div>
              <h3 className="mb-1 text-[17px] font-bold text-[var(--text-primary)]">
                NASA POWER
              </h3>
              <p className="text-[13px] font-normal text-[var(--text-muted)]">
                Global climatology data and solar radiation monitoring.
              </p>
            </div>

            <div className="tonal-border rounded-xl bg-[var(--surface)] p-4">
              <div className="mb-3 flex items-start justify-between">
                <Waves className="h-5 w-5 text-[var(--leaf-green)]" />
                <div className="h-2 w-2 rounded-full bg-[var(--leaf-green)]" />
              </div>
              <h3 className="mb-1 text-[17px] font-bold text-[var(--text-primary)]">
                NOAA
              </h3>
              <p className="text-[13px] font-normal text-[var(--text-muted)]">
                Oceanic disturbances and oceanic-atmospheric shifts.
              </p>
            </div>

            <div className="tonal-border rounded-xl bg-[var(--surface)] p-4">
              <div className="mb-3 flex items-start justify-between">
                <Thermometer className="h-5 w-5 text-[var(--leaf-green)]" />
                <div className="h-2 w-2 rounded-full bg-[var(--leaf-green)]" />
              </div>
              <h3 className="mb-1 text-[17px] font-bold text-[var(--text-primary)]">
                PHIVOLCS
              </h3>
              <p className="text-[13px] font-normal text-[var(--text-muted)]">
                Seismic activity and volcanic threat assessments.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works: Vertical Timeline */}
        <section className="mb-10">
          <h2 className="mb-4 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
            HOW IT WORKS
          </h2>
          <div className="space-y-3">
            {[
              {
                step: "1",
                title: "Continuous Ingestion",
                body: "Global and local satellite feeds updated every 15 minutes.",
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
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    {item.title}
                  </h4>
                  <p className="text-[13px] font-normal text-[var(--text-muted)]">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Project Meta: Built at CodeKada */}
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

