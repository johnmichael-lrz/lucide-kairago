"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  UserCircle,
  Target,
  ListFilter,
  X,
  Plus,
  Minus,
  LocateFixed,
  TriangleAlert,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RiskLevel = "SAFE" | "MODERATE RISK" | "EVACUATE NOW";

const DEFAULT_RISKS: Record<string, RiskLevel> = {
  "Barangay Pag-asa": "SAFE",
  "Barangay San Roque Marikina": "MODERATE RISK",
  "Barangay Poblacion Leyte": "EVACUATE NOW",
};

function markerClasses(risk: RiskLevel) {
  if (risk === "EVACUATE NOW") {
    return {
      dot: "h-6 w-6 animate-pulse rounded-full border-4 border-white/30 bg-[var(--terracotta)]",
      dotShadow: "0 0 20px rgba(199,84,38,0.6)",
      label:
        "rounded bg-[var(--terracotta)] px-2 py-0.5 text-[11px] font-extrabold text-white shadow-lg",
    };
  }
  if (risk === "MODERATE RISK") {
    return {
      dot: "h-4 w-4 rounded-full border-2 border-white/20 bg-[var(--golden-yellow)]",
      dotShadow: "0 0 12px rgba(255,212,0,0.5)",
      label:
        "rounded bg-[color:var(--background)]/60 px-1 text-[10px] font-bold text-[var(--golden-yellow)]",
    };
  }
  return {
    dot: "h-4 w-4 rounded-full border-2 border-white/20 bg-[var(--leaf-green)]",
    dotShadow: "0 0 12px rgba(135,216,158,0.5)",
    label:
      "rounded bg-[color:var(--background)]/60 px-1 text-[10px] font-bold text-[var(--leaf-green)]",
  };
}

function bottomSheetRiskLabel(risk: RiskLevel) {
  if (risk === "EVACUATE NOW") return "CRITICAL RISK";
  if (risk === "MODERATE RISK") return "ADVISORY ACTIVE";
  return "ALL CLEAR";
}

export default function MapPage() {
  const [risks, setRisks] =
    useState<Record<string, RiskLevel>>(DEFAULT_RISKS);

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const res = await fetch("/api/barangay/risk");
        const data = await res.json();
        if (data.risks && Object.keys(data.risks).length > 0) {
          setRisks((prev) => ({ ...prev, ...data.risks }));
        }
      } catch {
        // keep defaults on failure
      }
    };
    fetchRisks();
  }, []);

  const pagasaRisk = risks["Barangay Pag-asa"] ?? "SAFE";
  const sanRoqueRisk = risks["Barangay San Roque Marikina"] ?? "MODERATE RISK";
  const poblacionRisk = risks["Barangay Poblacion Leyte"] ?? "EVACUATE NOW";

  const pagasa = markerClasses(pagasaRisk);
  const sanRoque = markerClasses(sanRoqueRisk);
  const poblacion = markerClasses(poblacionRisk);

  const bottomRisk = poblacionRisk;
  const bottomLabel = bottomSheetRiskLabel(bottomRisk);
  const bottomBorderColor =
    bottomRisk === "EVACUATE NOW"
      ? "border-[var(--terracotta)]"
      : bottomRisk === "MODERATE RISK"
        ? "border-[var(--golden-yellow)]"
        : "border-[var(--leaf-green)]";
  const bottomTextColor =
    bottomRisk === "EVACUATE NOW"
      ? "text-[var(--terracotta)]"
      : bottomRisk === "MODERATE RISK"
        ? "text-[var(--golden-yellow)]"
        : "text-[var(--leaf-green)]";
  const bottomBgColor =
    bottomRisk === "EVACUATE NOW"
      ? "bg-[color:var(--terracotta)]/12"
      : bottomRisk === "MODERATE RISK"
        ? "bg-[color:var(--golden-yellow)]/12"
        : "bg-[color:var(--leaf-green)]/12";
  const bottomBadgeBorder =
    bottomRisk === "EVACUATE NOW"
      ? "border-[color:var(--terracotta)]/40 bg-[color:var(--terracotta)]/20 text-[var(--terracotta)]"
      : bottomRisk === "MODERATE RISK"
        ? "border-[color:var(--golden-yellow)]/40 bg-[color:var(--golden-yellow)]/20 text-[var(--golden-yellow)]"
        : "border-[color:var(--leaf-green)]/40 bg-[color:var(--leaf-green)]/20 text-[var(--leaf-green)]";

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 z-40 w-full border-b border-white/10 bg-[var(--surface)]">
        <div className="mx-auto flex h-14 w-full max-w-[640px] items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--primary)]" />
            <span className="tracking-tight text-[24px] font-bold text-[var(--on-surface)]">
              Kairago
            </span>
          </div>
          <div className="flex items-center">
            <UserCircle className="h-6 w-6 text-[var(--on-surface)]" />
          </div>
        </div>
      </header>

      {/* Map Content & Overlays */}
      <main className="map-bg relative mx-auto h-screen w-full max-w-[640px] overflow-hidden pb-[64px] pt-14">
        {/* Currently Viewing Header */}
        <div className="absolute left-0 right-0 top-[68px] z-20 px-4">
          <div className="flex items-center justify-between rounded-xl border border-white/12 bg-[color:var(--surface-raised)]/90 p-3 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[color:var(--primary)]/20 p-2">
                <Target className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <p className="mb-1 leading-none text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                  CURRENTLY VIEWING
                </p>
                <p className="text-[15px] font-bold text-white">
                  Leyte Province, Region VIII
                </p>
              </div>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-white/10">
              <ListFilter className="h-5 w-5 text-[var(--on-surface)]" />
            </button>
          </div>

          {/* Filter Chips */}
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-2">
            {["Pag-asa", "San Roque", "Poblacion"].map((chip) => (
              <div
                key={chip}
                className="flex shrink-0 items-center gap-2 rounded-full border border-white/20 bg-[var(--surface-raised)] px-3 py-1.5"
              >
                <span className="text-[11px] font-medium text-[var(--on-surface)]">
                  {chip}
                </span>
                <X className="h-[14px] w-[14px] text-[var(--text-muted)]" />
              </div>
            ))}
          </div>
        </div>

        {/* Map Visual */}
        <div className="absolute inset-0 z-0">
          <img
            className="h-full w-full object-cover opacity-60"
            alt="A specialized digital satellite map of Leyte Province with a dark aesthetic."
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDowZc37FD2lHsL6zaU5XwqZO4x2IB7Ux4dR6XijJKL3cKumHJKWYcnuOPRdLCLQ5oNLpdhMTmm0auQSy_DS7XtLrJkm0r7YwddShbrlvbyrDOE50LcOutmwdl4LrA0bNkez5xp9IijMmBIPVa2X1awl4nSK9k3q0HZfA9XbllYWxdyGsU7uLDZf9Omj3N8NVU8enJBPTb7JLZbPpvDoSot-nJNRvrL7AnNUgoiRILZ5Qrs1Ci98FsNiA9dPeBXVDd4sTULXQfjuhAE"
          />

          {/* Pag-asa marker */}
          <div className="absolute left-[45%] top-[35%] flex flex-col items-center">
            <div
              className={pagasa.dot}
              style={{ boxShadow: pagasa.dotShadow }}
            />
            <span className={cn("mt-1", pagasa.label)}>PAG-ASA</span>
          </div>

          {/* San Roque marker */}
          <div className="absolute left-[30%] top-[55%] flex flex-col items-center">
            <div
              className={sanRoque.dot}
              style={{ boxShadow: sanRoque.dotShadow }}
            />
            <span className={cn("mt-1", sanRoque.label)}>SAN ROQUE</span>
          </div>

          {/* Poblacion marker */}
          <div className="absolute left-[55%] top-[50%] flex flex-col items-center">
            <div
              className={poblacion.dot}
              style={{ boxShadow: poblacion.dotShadow }}
            />
            <span className={cn("mt-1", poblacion.label)}>POBLACION</span>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute bottom-[40%] right-4 z-20 flex flex-col gap-2">
          <button className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/12 bg-[var(--surface-raised)] text-[var(--on-surface)] shadow-xl">
            <Plus className="h-5 w-5" />
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/12 bg-[var(--surface-raised)] text-[var(--on-surface)] shadow-xl">
            <Minus className="h-5 w-5" />
          </button>
          <button className="mt-2 flex h-11 w-11 items-center justify-center rounded-lg border border-white/12 bg-[var(--surface-raised)] text-[var(--primary)] shadow-xl">
            <LocateFixed className="h-5 w-5" />
          </button>
        </div>

        {/* Bottom Sheet */}
        <div className="absolute bottom-0 left-0 right-0 z-30 translate-y-0 transform rounded-t-[24px] border-t border-white/12 bg-[var(--surface)] shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-transform duration-300">
          <div className="flex justify-center py-3">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>
          <div className="px-6 pb-10">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="mb-1 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                  CURRENT LOCATION
                </p>
                <h2 className="text-[28px] font-bold leading-tight text-white">
                  BARANGAY POBLACION
                </h2>
              </div>
              <div
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1",
                  bottomBadgeBorder
                )}
              >
                <span className="text-[11px] font-medium uppercase">
                  {bottomLabel}
                </span>
              </div>
            </div>

            {/* Risk Bulletin Card */}
            <div
              className={cn(
                "mb-6 rounded-r-lg border-l-4 p-4",
                bottomBorderColor,
                bottomBgColor
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <TriangleAlert className={cn("h-5 w-5", bottomTextColor)} />
                <span className={cn("text-[18px] font-bold", bottomTextColor)}>
                  {poblacionRisk}
                </span>
              </div>
              <p className="text-[15px] font-normal leading-[1.5] text-[color:var(--on-surface)]/90">
                Water levels have exceeded the{" "}
                <span className="font-bold text-white">12.5m threshold</span>.
                Immediate flash flooding is imminent in low-lying residential
                sectors.
              </p>
            </div>

            {/* Data Row */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-[var(--surface-raised)]">
                  <Users className="h-5 w-5 text-[var(--text-muted)]" />
                </div>
                <span className="text-[15px] font-medium text-white">
                  1,240 PEOPLE AFFECTED
                </span>
              </div>
              <button className="rounded-lg border border-white/12 bg-[var(--surface-raised)] px-4 py-2 text-[13px] font-medium text-[var(--on-surface)]">
                VIEW FULL REPORT
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
