"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  MapPin,
  LocateFixed,
  X,
  ArrowRight,
  Volume2,
  Share2,
  Download,
  Bookmark,
  AlertTriangle,
  Loader2,
  Sun,
  CloudSun,
  Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Scenario = "safe" | "moderate" | "evacuate";

/** Recommended action spoken for each scenario (Web Speech API). */
const RECOMMENDED_ACTION_VOICE: Record<Scenario, string> = {
  safe: "No evacuation necessary. Monitor local channels",
  moderate: "Prepare go-bag. Move valuables higher. Avoid riverbanks",
  evacuate: "Move your community to higher ground immediately",
};

const RISK_LEVEL_LABEL: Record<Scenario, string> = {
  safe: "SAFE",
  moderate: "MODERATE RISK",
  evacuate: "EVACUATE NOW",
};

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

async function copyTextToClipboard(text: string) {
  // Prefer async Clipboard API when available.
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback for older browsers: temporarily inject a textarea.
  if (typeof document === "undefined") return;
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

function ListenBulletinButton(props: {
  isSpeakingBulletin: boolean;
  onListen: () => void;
}) {
  const { isSpeakingBulletin, onListen } = props;

  return (
    <button
      type="button"
      suppressHydrationWarning
      disabled={isSpeakingBulletin}
      onClick={onListen}
      aria-busy={isSpeakingBulletin}
      aria-label={
        isSpeakingBulletin
          ? "Speaking recommended action"
          : "Listen to bulletin (recommended action)"
      }
      className={cn(
        "flex items-center gap-2 text-[var(--text-muted)] transition-colors hover:text-white",
        "disabled:pointer-events-none disabled:opacity-70"
      )}
    >
      {isSpeakingBulletin ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Volume2 className="h-5 w-5 shrink-0" aria-hidden />
      )}
      <span className="text-[13px] font-normal">
        {isSpeakingBulletin ? "Speaking…" : "LISTEN TO BULLETIN"}
      </span>
    </button>
  );
}

export default function Home() {
  const [scenario, setScenario] = useState<Scenario>("safe");
  const [isSpeakingBulletin, setIsSpeakingBulletin] = useState(false);
  const [shareCopiedVisible, setShareCopiedVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationErrorVisible, setLocationErrorVisible] = useState(false);
  /** Countdown duration in ms; null until client mount (avoids hydration mismatch). */
  const [landfallEtaMs, setLandfallEtaMs] = useState<number | null>(null);

  useEffect(() => {
    // Demo: 6h countdown, initialized only on the client after mount.
    setLandfallEtaMs(6 * 60 * 60 * 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!shareCopiedVisible) return;
    const id = window.setTimeout(() => setShareCopiedVisible(false), 2000);
    return () => window.clearTimeout(id);
  }, [shareCopiedVisible]);

  useEffect(() => {
    if (!locationErrorVisible) return;
    const id = window.setTimeout(() => setLocationErrorVisible(false), 2000);
    return () => window.clearTimeout(id);
  }, [locationErrorVisible]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingBulletin(false);
  }, [scenario]);

  const handleListenBulletin = useCallback(() => {
    if (typeof window === "undefined") return;

    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") return;

    synth.cancel();
    setIsSpeakingBulletin(true);

    const utterance = new SpeechSynthesisUtterance(
      RECOMMENDED_ACTION_VOICE[scenario]
    );
    utterance.lang = "en-US";

    const text = RECOMMENDED_ACTION_VOICE[scenario];
    const fallbackMs = Math.min(60_000, text.length * 80 + 2000);
    let finished = false;
    const cleanup = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      setIsSpeakingBulletin(false);
    }, fallbackMs);

    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(cleanup);
      setIsSpeakingBulletin(false);
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    synth.speak(utterance);
  }, [scenario]);

  const bulletinShareText = useMemo(() => {
    return `Risk level: ${RISK_LEVEL_LABEL[scenario]}\nRecommended action: ${RECOMMENDED_ACTION_VOICE[scenario]}`;
  }, [scenario]);

  const handleShareBulletin = useCallback(async () => {
    if (typeof window === "undefined") return;

    const url = window.location.href;
    const title = "Kairago — Risk Bulletin";
    const text = bulletinShareText;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch {
      // If user cancels share or the share fails, we still fall back to clipboard.
    }

    try {
      await copyTextToClipboard(`${title}\n\n${text}\n\n${url}`);
      setShareCopiedVisible(true);
    } catch {
      // Ignore: no supported copy path.
    }
  }, [bulletinShareText]);

  const handleUseMyLocation = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!navigator.geolocation) {
      setLocationErrorVisible(true);
      return;
    }

    setIsLocating(true);
    setLocationErrorVisible(false);

    const seeded = [
      { name: "Barangay Pag-asa", lat: 14.6507, lon: 121.0794 },
      { name: "Barangay San Roque Marikina", lat: 14.6507, lon: 121.1 },
      { name: "Barangay Poblacion Leyte", lat: 11.2442, lon: 124.9996 },
    ] as const;
    type SeededBarangayName = (typeof seeded)[number]["name"];

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const distanceKm = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ) => {
      // Simple Haversine distance (good enough for proximity matching).
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let nearestName: SeededBarangayName = seeded[0].name;
        let nearestDistanceKm = Number.POSITIVE_INFINITY;
        for (const cur of seeded) {
          const d = distanceKm(latitude, longitude, cur.lat, cur.lon);
          if (d < nearestDistanceKm) {
            nearestDistanceKm = d;
            nearestName = cur.name;
          }
        }

        setSearchQuery(nearestName);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationErrorVisible(true);
        } else {
          setLocationErrorVisible(true);
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
    );
  }, []);

  const landfallReady = landfallEtaMs !== null;

  useEffect(() => {
    if (scenario !== "evacuate" || !landfallReady) return;
    const id = window.setInterval(() => {
      setLandfallEtaMs((prev) =>
        prev === null ? null : Math.max(0, prev - 1000)
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, [scenario, landfallReady]);

  const landfallClock = useMemo(() => {
    if (landfallEtaMs === null) return "--:--:--";
    const totalSeconds = Math.floor(landfallEtaMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  }, [landfallEtaMs]);

  return (
    <>
      {/* Top AppBar Shell */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--surface)]">
        <div className="mx-auto flex h-14 w-full max-w-[640px] items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--leaf-green)]" />
            <h1 className="tracking-tight text-[24px] font-bold text-[var(--on-surface)]">
              Kairago
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-[var(--leaf-green)]">
              SYSTEM LIVE
            </span>
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--leaf-green)]" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[640px] px-4 pb-24">
        {/* API Health Row */}
        <div className="hide-scrollbar flex items-center justify-between overflow-x-auto border-b border-white/5 py-3">
          <div className="flex shrink-0 items-center gap-4">
            {["PAGASA", "NOAA", "PHIVOLCS", "System Ok"].map((label) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--leaf-green)]" />
                <span className="text-[9px] font-bold text-[var(--text-muted)]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Language Selector */}
        <div className="mt-4 flex border-b border-white/5">
          <button
            type="button"
            suppressHydrationWarning
            className="border-b-2 border-[var(--leaf-green)] px-4 py-3 text-[11px] font-medium tracking-[0.1em] text-[var(--leaf-green)]"
          >
            ENGLISH
          </button>
          <button
            type="button"
            suppressHydrationWarning
            className="px-4 py-3 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]"
          >
            FILIPINO
          </button>
          <button
            type="button"
            suppressHydrationWarning
            className="px-4 py-3 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]"
          >
            CEBUANO
          </button>
        </div>

        {/* Search Section */}
        <div className="mt-6 space-y-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search for your barangay"
              suppressHydrationWarning
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-lg border border-white/12 bg-[var(--surface-raised)] pl-10 pr-4 text-[15px] italic text-[var(--text-muted)] focus:border-[color:var(--leaf-green)]/50 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <button
              type="button"
              suppressHydrationWarning
              disabled={isLocating}
              onClick={handleUseMyLocation}
              aria-busy={isLocating}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/12 bg-[var(--surface-raised)] text-[13px] font-normal text-[var(--text-muted)] transition-transform active:scale-95",
                "disabled:pointer-events-none disabled:opacity-70"
              )}
            >
              {isLocating ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
              ) : (
                <LocateFixed className="h-[18px] w-[18px]" />
              )}
              {isLocating ? "LOCATING…" : "USE MY LOCATION"}
            </button>
            {locationErrorVisible && (
              <p className="text-[12px] text-[var(--terracotta)]" role="status">
                Location access denied. Please search manually
              </p>
            )}
          </div>
        </div>

        {/* Saved Barangay Chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {["Santa Rosa", "San Lorenzo", "Don Bosco"].map((chip) => (
            <div
              key={chip}
              className="flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1.5"
            >
              <span className="text-[11px] font-medium text-[var(--on-surface)]">
                {chip}
              </span>
              <X className="h-4 w-4 cursor-pointer text-[var(--text-muted)]" />
            </div>
          ))}
        </div>

        {/* Scenario Tabs */}
        <div className="mt-8 flex border-b border-white/5">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setScenario("safe")}
            className={
              scenario === "safe"
                ? "flex-1 border-b-2 border-[var(--leaf-green)] py-3 text-[11px] font-medium tracking-[0.1em] text-[var(--leaf-green)]"
                : "flex-1 py-3 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]"
            }
          >
            SAFE
          </button>
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setScenario("moderate")}
            className={
              scenario === "moderate"
                ? "flex-1 border-b-2 border-[var(--golden-yellow)] py-3 text-[11px] font-medium tracking-[0.1em] text-[var(--golden-yellow)]"
                : "flex-1 py-3 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]"
            }
          >
            MODERATE RISK
          </button>
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setScenario("evacuate")}
            className={
              scenario === "evacuate"
                ? "flex-1 border-b-2 border-[var(--terracotta)] py-3 text-[11px] font-medium tracking-[0.1em] text-[var(--terracotta)]"
                : "flex-1 py-3 text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]"
            }
          >
            EVACUATE NOW
          </button>
        </div>

        {/* Risk Bulletin Card */}
        {scenario === "safe" && (
          <div className="relative mt-6 overflow-hidden rounded-r-xl border-l-4 border-[var(--leaf-green)] bg-[var(--surface)]">
            <div className="pointer-events-none absolute inset-0 bg-[var(--leaf-green)] opacity-10" />
            <div className="relative space-y-4 p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="block text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    STATUS
                  </span>
                  <h2 className="text-[48px] font-extrabold leading-[1.1] text-white">
                    SAFE
                  </h2>
                </div>
                <div className="rounded-full border border-[var(--leaf-green)] bg-[color:var(--leaf-green)]/20 px-2 py-1">
                  <span className="text-[11px] font-medium uppercase text-[var(--leaf-green)]">
                    Data Confidence High
                  </span>
                </div>
              </div>
              <hr className="border-white/10" />
              <p className="text-[15px] font-normal leading-[1.5] text-[var(--text-body)]">
                Current atmospheric conditions indicate no immediate threat of
                flooding or severe weather in your area. Satellite data shows
                clear skies with minimal cloud formation. Local sensors report
                stable water levels across all primary monitoring stations.
              </p>
              <div className="space-y-2 pt-2">
                <span className="block text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                  RECOMMENDED ACTION
                </span>
                <div className="flex items-center justify-between">
                  <p className="text-[17px] font-bold text-white">
                    No evacuation necessary. Monitor local channels
                  </p>
                  <ArrowRight className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4">
                <ListenBulletinButton
                  isSpeakingBulletin={isSpeakingBulletin}
                  onListen={handleListenBulletin}
                />
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={handleShareBulletin}
                      aria-label="Share bulletin"
                      className="text-[var(--text-muted)] transition-colors hover:text-white"
                    >
                      <Share2 className="h-5 w-5" aria-hidden />
                    </button>
                    <span
                      className={cn(
                        "mt-1 text-[11px] text-[var(--text-muted)] transition-opacity",
                        shareCopiedVisible ? "opacity-100" : "opacity-0"
                      )}
                      aria-live="polite"
                    >
                      Copied to clipboard
                    </span>
                  </div>
                  <Download className="h-5 w-5 cursor-pointer text-[var(--text-muted)] hover:text-white" />
                  <Bookmark className="h-5 w-5 cursor-pointer text-[var(--text-muted)] hover:text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {scenario === "moderate" && (
          <div className="relative mt-6 overflow-hidden rounded-r-xl border-l-4 border-[var(--golden-yellow)] bg-[var(--surface)]">
            <div className="pointer-events-none absolute inset-0 bg-[var(--golden-yellow)] opacity-10" />
            <div className="relative space-y-4 p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="block text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    STATUS
                  </span>
                  <h2 className="text-[48px] font-extrabold leading-[1.1] text-[var(--golden-yellow)]">
                    MODERATE RISK
                  </h2>
                </div>
                <div className="rounded-full border border-[var(--golden-yellow)] bg-[color:var(--golden-yellow)]/20 px-2 py-1">
                  <span className="text-[11px] font-medium uppercase text-[var(--golden-yellow)]">
                    Advisory Active
                  </span>
                </div>
              </div>
              <hr className="border-white/10" />
              <p className="text-[15px] font-normal leading-[1.5] text-[var(--text-body)]">
                A sustained band of heavy rainfall is tracking toward your
                watershed. Runoff is expected to increase rapidly, with a high
                likelihood of street-level flooding in low-lying zones and
                near-channel communities within the next 6–12 hours.
              </p>
              <div className="space-y-2 pt-2">
                <span className="block text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                  RECOMMENDED ACTION
                </span>
                <div className="flex items-center justify-between">
                  <p className="text-[17px] font-bold text-white">
                    Prepare go-bag. Move valuables higher. Avoid riverbanks
                  </p>
                  <ArrowRight className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4">
                <ListenBulletinButton
                  isSpeakingBulletin={isSpeakingBulletin}
                  onListen={handleListenBulletin}
                />
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={handleShareBulletin}
                      aria-label="Share bulletin"
                      className="text-[var(--text-muted)] transition-colors hover:text-white"
                    >
                      <Share2 className="h-5 w-5" aria-hidden />
                    </button>
                    <span
                      className={cn(
                        "mt-1 text-[11px] text-[var(--text-muted)] transition-opacity",
                        shareCopiedVisible ? "opacity-100" : "opacity-0"
                      )}
                      aria-live="polite"
                    >
                      Copied to clipboard
                    </span>
                  </div>
                  <Download className="h-5 w-5 cursor-pointer text-[var(--text-muted)] hover:text-white" />
                  <Bookmark className="h-5 w-5 cursor-pointer text-[var(--text-muted)] hover:text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {scenario === "evacuate" && (
          <div className="relative mt-6 overflow-hidden rounded-r-xl border-l-4 border-[var(--terracotta)] bg-[var(--surface)]">
            <div className="pointer-events-none absolute inset-0 bg-[var(--terracotta)] opacity-10" />
            <div className="relative space-y-4 p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <span className="block text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                    STATUS
                  </span>
                  <h2 className="text-[48px] font-extrabold leading-[1.1] text-[var(--terracotta)]">
                    EVACUATE NOW
                  </h2>

                  <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-[color:var(--terracotta)]/40 bg-[color:var(--terracotta)]/15 px-3 py-1">
                    <AlertTriangle className="h-4 w-4 text-[var(--terracotta)]" />
                    <span className="text-[11px] font-medium tracking-[0.1em] text-[var(--terracotta)]">
                      LANDFALL IN
                    </span>
                    <span
                      className="text-[13px] font-bold text-white tabular-nums"
                      suppressHydrationWarning
                    >
                      {landfallReady ? landfallClock : "--:--:--"}
                    </span>
                  </div>
                </div>
                <div className="rounded-full border border-[var(--terracotta)] bg-[color:var(--terracotta)]/20 px-2 py-1">
                  <span className="text-[11px] font-medium uppercase text-[var(--terracotta)]">
                    Emergency Bulletin
                  </span>
                </div>
              </div>
              <hr className="border-white/10" />
              <p className="text-[15px] font-normal leading-[1.5] text-[var(--text-body)]">
                Typhoon landfall is imminent. Forecast models indicate
                destructive winds and rapid surge in rainfall intensity. If you
                are within flood-prone areas, coastal zones, or near steep
                slopes, evacuate immediately to designated shelters and avoid
                travel through waterways.
              </p>

              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  suppressHydrationWarning
                  className="h-11 w-full rounded-lg border border-[color:var(--terracotta)]/50 bg-[color:var(--terracotta)]/20 px-4 text-[13px] font-bold tracking-[0.06em] text-white transition-transform active:scale-95"
                >
                  VIEW SHELTERS
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <ListenBulletinButton
                  isSpeakingBulletin={isSpeakingBulletin}
                  onListen={handleListenBulletin}
                />
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={handleShareBulletin}
                      aria-label="Share bulletin"
                      className="text-[var(--text-muted)] transition-colors hover:text-white"
                    >
                      <Share2 className="h-5 w-5" aria-hidden />
                    </button>
                    <span
                      className={cn(
                        "mt-1 text-[11px] text-[var(--text-muted)] transition-opacity",
                        shareCopiedVisible ? "opacity-100" : "opacity-0"
                      )}
                      aria-live="polite"
                    >
                      Copied to clipboard
                    </span>
                  </div>
                  <Download className="h-5 w-5 cursor-pointer text-[var(--text-muted)] hover:text-white" />
                  <Bookmark className="h-5 w-5 cursor-pointer text-[var(--text-muted)] hover:text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 72-HR RISK FORECAST */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h3 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
              72-HR RISK FORECAST
            </h3>
            <span className="text-[11px] font-medium text-[var(--leaf-green)]">
              STABLE TREND
            </span>
          </div>
          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
            {[
              { id: "12-1", time: "12:00", Icon: Sun, rain: "0.2 mm/h" },
              { id: "18-1", time: "18:00", Icon: CloudSun, rain: "0.5 mm/h" },
              { id: "00-1", time: "00:00", Icon: Cloud, rain: "1.2 mm/h" },
              { id: "06-1", time: "06:00", Icon: Cloud, rain: "1.0 mm/h" },
              { id: "12-2", time: "12:00", Icon: Sun, rain: "0.1 mm/h" },
              { id: "18-2", time: "18:00", Icon: Sun, rain: "0.0 mm/h" },
            ].map(({ id, time, Icon, rain }) => (
              <div
                key={id}
                className="flex w-24 flex-shrink-0 flex-col items-center gap-2 rounded-xl border border-white/8 bg-[var(--surface-raised)] p-3"
              >
                <span className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
                  {time}
                </span>
                <Icon className="h-5 w-5 text-[var(--leaf-green)]" />
                <span className="text-[11px] font-medium text-[var(--leaf-green)]">
                  SAFE
                </span>
                <span className="text-[13px] font-normal text-[var(--text-muted)]">
                  {rain}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Data Attribution Row */}
        <div className="mt-8 flex flex-wrap gap-2 opacity-60">
          {["PAGASA", "NASA POWER", "NOAA", "PHIVOLCS"].map((src) => (
            <div
              key={src}
              className="rounded bg-white/5 border border-white/10 px-2 py-1"
            >
              <span className="text-[9px] font-bold text-[var(--text-muted)]">
                {src}
              </span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
