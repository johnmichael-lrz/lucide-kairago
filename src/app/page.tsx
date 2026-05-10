"use client";

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
import { type Bulletin } from "@/lib/bulletin-schema";

type MapboxFeature = {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
};
import { Toast } from "@/components/toast";
import { Header } from "@/components/Header";
import {
  readKairagoBarangays,
  readKairagoSettings,
  writeKairagoBarangays,
  type KairagoBarangays,
} from "@/lib/kairago-storage";
import { useLanguage, type AppLanguage } from "@/context/LanguageContext";

type Scenario = "safe" | "moderate" | "evacuate";
type Language = AppLanguage;

const RISK_LEVEL_LABEL: Record<Scenario, string> = {
  safe: "SAFE",
  moderate: "MODERATE RISK",
  evacuate: "EVACUATE NOW",
};

const DEMO_TEXT: Record<Scenario, string> = {
  safe: "Current atmospheric conditions indicate no immediate threat of flooding or severe weather in your area. Satellite data shows clear skies with minimal cloud formation. Local sensors report stable water levels across all primary monitoring stations.",
  moderate:
    "A sustained band of heavy rainfall is tracking toward your watershed. Runoff is expected to increase rapidly, with a high likelihood of street-level flooding in low-lying zones and near-channel communities within the next 6–12 hours.",
  evacuate:
    "Typhoon landfall is imminent. Forecast models indicate destructive winds and rapid surge in rainfall intensity. If you are within flood-prone areas, coastal zones, or near steep slopes, evacuate immediately to designated shelters and avoid travel through waterways.",
};

const DEMO_ACTION: Record<Scenario, string> = {
  safe: "No evacuation necessary. Monitor local channels",
  moderate: "Prepare go-bag. Move valuables higher. Avoid riverbanks",
  evacuate: "Move your community to higher ground immediately",
};

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
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
  const { language: activeLanguage, setLanguage: setActiveLanguage } = useLanguage();
  const [scenario, setScenario] = useState<Scenario>("safe");
  const [isSpeakingBulletin, setIsSpeakingBulletin] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("Copied to clipboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [landfallEtaMs, setLandfallEtaMs] = useState<number | null>(null);
  const [isLoadingBulletin, setIsLoadingBulletin] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [liveBulletin, setLiveBulletin] = useState<Bulletin | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [healthStatus, setHealthStatus] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [savedBarangays, setSavedBarangays] = useState<KairagoBarangays>({ items: [] });
  const [autoTtsEnabled, setAutoTtsEnabled] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLandfallEtaMs(6 * 60 * 60 * 1000); }, []);

  useEffect(() => {
    setSavedBarangays(readKairagoBarangays());
    setAutoTtsEnabled(readKairagoSettings().autoTextToSpeech);
    const onBarangaysUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail) setSavedBarangays(ce.detail as KairagoBarangays);
      else setSavedBarangays(readKairagoBarangays());
    };
    const onSettingsUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail) setAutoTtsEnabled(!!(ce.detail as any).autoTextToSpeech);
      else setAutoTtsEnabled(readKairagoSettings().autoTextToSpeech);
    };
    const onStorage = () => {
      setSavedBarangays(readKairagoBarangays());
      setAutoTtsEnabled(readKairagoSettings().autoTextToSpeech);
    };
    window.addEventListener("kairago-barangays-updated", onBarangaysUpdate);
    window.addEventListener("kairago-settings-updated", onSettingsUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("kairago-barangays-updated", onBarangaysUpdate);
      window.removeEventListener("kairago-settings-updated", onSettingsUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!autoTtsEnabled) return;
    if (typeof window === "undefined") return;
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return;
    if (!liveBulletin?.bulletin_text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(liveBulletin.bulletin_text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }, [autoTtsEnabled, liveBulletin?.bulletin_text]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingBulletin(false);
  }, [scenario]);

  const landfallReady = landfallEtaMs !== null;
  useEffect(() => {
    if (scenario !== "evacuate" || !landfallReady) return;
    const id = window.setInterval(() => {
      setLandfallEtaMs((prev) => prev === null ? null : Math.max(0, prev - 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [scenario, landfallReady]);

  useEffect(() => {
    if (!liveBulletin) return;
    const map: Record<string, Scenario> = {
      SAFE: "safe",
      "MODERATE RISK": "moderate",
      "EVACUATE NOW": "evacuate",
    };
    const mapped = map[liveBulletin.risk_level];
    if (mapped) setScenario(mapped);
  }, [liveBulletin]);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setHealthStatus({
          nasa_power: data.sources?.nasa_power?.status ?? "red",
          noaa: data.sources?.noaa?.status ?? "red",
        });
      } catch {
        setHealthStatus({ nasa_power: "red", noaa: "red" });
      }
    };
    fetchHealth();
    const id = window.setInterval(fetchHealth, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const controller = new AbortController();
    const timerId = window.setTimeout(async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?country=PH&types=locality,neighborhood,place&access_token=${token}&limit=6`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        const features: MapboxFeature[] = data.features ?? [];
        setSuggestions(features.slice(0, 6));
        setShowSuggestions(features.length > 0);
      } catch {
        // ignore
      }
    }, 300);
    return () => {
      window.clearTimeout(timerId);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const healthDotClass = (key: string) => {
    const status = healthStatus[key];
    if (status === "yellow") return "bg-[var(--golden-yellow)]";
    if (status === "red") return "bg-[var(--terracotta)]";
    return "bg-[var(--leaf-green)]";
  };

  const runAgentPipeline = useCallback(
    async (name: string, coords?: { lat: number; lng: number }) => {
      setIsLoadingBulletin(true);
      setProgressMessage("Starting…");
      setLiveBulletin(null);
      setTranslatedText(null);
      setActiveLanguage("ENGLISH");
      setIsTranslating(false);
      try {
        const res = await fetch("/api/agent/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barangay_name: name, coordinates: coords }),
        });
        if (!res.body) throw new Error("No response body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";
          for (const chunk of chunks) {
            if (!chunk.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(chunk.slice(6));
              if (event.type === "progress") setProgressMessage(event.message);
              else if (event.type === "bulletin") setLiveBulletin(event.data);
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.error("Agent stream error:", err);
      } finally {
        setIsLoadingBulletin(false);
      }
    },
    []
  );

  const addSavedBarangay = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const next = {
        ...savedBarangays,
        items: savedBarangays.items.includes(trimmed)
          ? savedBarangays.items
          : [trimmed, ...savedBarangays.items],
      };
      setSavedBarangays(next);
      writeKairagoBarangays(next);
    },
    [savedBarangays]
  );

  const handleSearch = useCallback(
    (name: string, coords?: { lat: number; lng: number }) => {
      if (!name.trim()) return;
      setShowSuggestions(false);
      runAgentPipeline(name, coords);
    },
    [runAgentPipeline]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && searchQuery.trim()) handleSearch(searchQuery);
      if (e.key === "Escape") setShowSuggestions(false);
    },
    [searchQuery, handleSearch]
  );

  const handleUseMyLocation = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!navigator.geolocation) {
      setToastMessage("Location access denied. Please search your barangay manually.");
      setToastVisible(true);
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          if (!token) throw new Error("No token");
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=locality,neighborhood&access_token=${token}`;
          const res = await fetch(url);
          const data = await res.json();
          const feature: MapboxFeature | undefined = data.features?.[0];
          if (feature) {
            const name = feature.text;
            const featureLat = feature.center[1];
            const featureLng = feature.center[0];
            const distanceKm = haversineKm(latitude, longitude, featureLat, featureLng);
            if (distanceKm > 50) {
              setToastMessage("Nearest barangay found may not be accurate. Please verify your location.");
              setToastVisible(true);
            }
            setSearchQuery(name);
            addSavedBarangay(name);
            runAgentPipeline(name, { lat: latitude, lng: longitude });
          }
        } catch {
          runAgentPipeline("", { lat: latitude, lng: longitude });
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setToastMessage("Location access denied. Please search your barangay manually.");
        setToastVisible(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [runAgentPipeline, addSavedBarangay]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (activeLanguage === "ENGLISH") { setTranslatedText(null); return; }
      if (!liveBulletin?.bulletin_text) return;
      setIsTranslating(true);
      try {
        const res = await fetch("/api/bulletin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: liveBulletin.bulletin_text,
            target_language: activeLanguage === "FILIPINO" ? "Filipino" : "Cebuano",
          }),
        });
        const data = await res.json();
        if (!cancelled && data.translated_text) setTranslatedText(data.translated_text);
      } catch {
        if (!cancelled) setTranslatedText(null);
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [activeLanguage, liveBulletin?.bulletin_text]);

  const currentBulletinText = useMemo(() => {
    if (!liveBulletin) return DEMO_TEXT[scenario];
    if (activeLanguage !== "ENGLISH" && translatedText) return translatedText;
    return liveBulletin.bulletin_text;
  }, [liveBulletin, scenario, activeLanguage, translatedText]);

  const currentAction = useMemo(() => {
    if (!liveBulletin) return DEMO_ACTION[scenario];
    return liveBulletin.recommended_action;
  }, [liveBulletin, scenario]);

  const confidenceLabel = useMemo(() => {
    if (!liveBulletin) return "Data Confidence High";
    return `${liveBulletin.confidence} Confidence`;
  }, [liveBulletin]);

  const showLiveSafe = liveBulletin?.risk_level === "SAFE" && scenario === "safe";
  const showLiveModerate = liveBulletin?.risk_level === "MODERATE RISK" && scenario === "moderate";
  const showLiveEvacuate = liveBulletin?.risk_level === "EVACUATE NOW" && scenario === "evacuate";

  const handleListenBulletin = useCallback(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") return;
    synth.cancel();
    setIsSpeakingBulletin(true);
    const text = currentAction;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
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
  }, [currentAction]);

  const handleDownloadBulletin = useCallback(() => {
    if (typeof window === "undefined") return;
    const level = liveBulletin ? liveBulletin.risk_level : RISK_LEVEL_LABEL[scenario];
    const text = `KAIRAGO RISK BULLETIN\n\nRisk Level: ${level}\n\nBulletin: ${currentBulletinText}\n\nRecommended Action: ${currentAction}\n\nGenerated: ${new Date().toLocaleString("en-PH")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kairago-bulletin.txt";
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage("Bulletin downloaded");
    setToastVisible(true);
  }, [liveBulletin, scenario, currentBulletinText, currentAction]);

  const handleBookmarkBulletin = useCallback(() => {
    if (typeof window === "undefined") return;
    const saved = JSON.parse(localStorage.getItem("saved-bulletins") ?? "[]");
    saved.unshift({
      risk_level: liveBulletin ? liveBulletin.risk_level : RISK_LEVEL_LABEL[scenario],
      bulletin_text: currentBulletinText,
      recommended_action: currentAction,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("saved-bulletins", JSON.stringify(saved.slice(0, 20)));
    setToastMessage("Bulletin saved");
    setToastVisible(true);
  }, [liveBulletin, scenario, currentBulletinText, currentAction]);

  const bulletinShareText = useMemo(() => {
    const level = liveBulletin ? liveBulletin.risk_level : RISK_LEVEL_LABEL[scenario];
    return `Risk level: ${level}\nRecommended action: ${currentAction}`;
  }, [liveBulletin, scenario, currentAction]);

  const handleShareBulletin = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const title = "Kairago — Risk Bulletin";
    const text = bulletinShareText;
    try {
      if (navigator.share) { await navigator.share({ title, text, url }); return; }
    } catch {
      // fall through
    }
    try {
      await copyTextToClipboard(`${title}\n\n${text}\n\n${url}`);
      setToastMessage("Copied to clipboard");
      setToastVisible(true);
    } catch {
      // ignore
    }
  }, [bulletinShareText]);

  const landfallClock = useMemo(() => {
    if (landfallEtaMs === null) return "--:--:--";
    const total = Math.floor(landfallEtaMs / 1000);
    return `${pad2(Math.floor(total / 3600))}:${pad2(Math.floor((total % 3600) / 60))}:${pad2(total % 60)}`;
  }, [landfallEtaMs]);

  const ActionRow = () => (
    <div className="flex items-center justify-between pt-4">
      <ListenBulletinButton isSpeakingBulletin={isSpeakingBulletin} onListen={handleListenBulletin} />
      <div className="flex gap-4">
        <button type="button" suppressHydrationWarning onClick={handleShareBulletin} aria-label="Share bulletin" className="text-[var(--text-muted)] transition-colors hover:text-white">
          <Share2 className="h-5 w-5" aria-hidden />
        </button>
        <button type="button" suppressHydrationWarning onClick={handleDownloadBulletin} aria-label="Download bulletin" className="text-[var(--text-muted)] transition-colors hover:text-white">
          <Download className="h-5 w-5" aria-hidden />
        </button>
        <button type="button" suppressHydrationWarning onClick={handleBookmarkBulletin} aria-label="Bookmark bulletin" className="text-[var(--text-muted)] transition-colors hover:text-white">
          <Bookmark className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
      <Header />
      <main className="mx-auto w-full max-w-[640px] px-4 pb-24">

        {/* API Health Row */}
        <div className="hide-scrollbar flex items-center justify-between overflow-x-auto border-b border-white/5 py-3">
          <div className="flex shrink-0 items-center gap-4">
            {[
              { label: "PAGASA", key: "nasa_power" },
              { label: "NOAA", key: "noaa" },
              { label: "PHIVOLCS", key: "nasa_power" },
              { label: "System Ok", key: "nasa_power" },
            ].map(({ label, key }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={cn("h-1.5 w-1.5 rounded-full", healthDotClass(key))} />
                <span className="text-[9px] font-bold text-[var(--text-muted)]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Language Selector */}
        <div className="mt-4 flex border-b border-white/5">
          {(["ENGLISH", "FILIPINO", "CEBUANO"] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              suppressHydrationWarning
              disabled={isTranslating}
              onClick={() => setActiveLanguage(lang)}
              className={cn(
                "px-4 py-3 text-[11px] font-medium tracking-[0.1em] transition-colors disabled:opacity-50",
                activeLanguage === lang
                  ? "border-b-2 border-[var(--leaf-green)] text-[var(--leaf-green)]"
                  : "text-[var(--text-muted)]"
              )}
            >
              {isTranslating && lang !== "ENGLISH" && lang !== activeLanguage ? (
                <Loader2 className="inline h-3 w-3 animate-spin" />
              ) : lang}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mt-6 space-y-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for your barangay"
              suppressHydrationWarning
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="h-11 w-full rounded-lg border border-white/12 bg-[var(--surface-raised)] pl-10 pr-4 text-[15px] italic text-[var(--text-muted)] focus:border-[color:var(--leaf-green)]/50 focus:outline-none"
            />
            {showSuggestions && (
              <div ref={suggestionsRef} className="absolute left-0 right-0 top-full z-40 mt-1 max-h-[288px] overflow-y-auto rounded-lg border border-white/12 bg-[var(--surface-raised)] shadow-xl">
                {suggestions.map((s) => {
                  const region = s.context?.find((c) => c.id.startsWith("region") || c.id.startsWith("place"))?.text ?? "";
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const name = s.text;
                        setSearchQuery(name);
                        addSavedBarangay(name);
                        handleSearch(name, { lat: s.center[1], lng: s.center[0] });
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-[var(--on-surface)] transition-colors hover:bg-white/5"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                      <span className="flex-1">
                        <span className="block">{s.text}</span>
                        <span className="block text-[12px] text-[var(--text-muted)]">{region}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
            {isLocating ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <LocateFixed className="h-[18px] w-[18px]" />}
            {isLocating ? "LOCATING…" : "USE MY LOCATION"}
          </button>
        </div>

        {/* Saved Barangay Chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {savedBarangays.items.map((chip) => (
            <div
              key={chip}
              className={cn(
                "flex items-center gap-1 rounded-full border bg-white/5 px-3 py-1.5",
                savedBarangays.default === chip ? "border-[color:var(--leaf-green)]/60" : "border-white/20"
              )}
            >
              {savedBarangays.default === chip && (
                <span className="mr-1 rounded-full bg-[color:var(--leaf-green)]/20 px-2 py-0.5 text-[9px] font-bold tracking-[0.12em] text-[var(--leaf-green)]">DEFAULT</span>
              )}
              <span className="text-[11px] font-medium text-[var(--on-surface)]">{chip}</span>
              <button
                type="button"
                aria-label={`Remove ${chip}`}
                onClick={() => {
                  const next = {
                    ...savedBarangays,
                    items: savedBarangays.items.filter((b) => b !== chip),
                    default: savedBarangays.default === chip ? undefined : savedBarangays.default,
                  };
                  setSavedBarangays(next);
                  writeKairagoBarangays(next);
                }}
                className="ml-1 text-[var(--text-muted)] transition-colors hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>

        {/* Scenario Tabs */}
        <div className="mt-8 flex gap-2">
          {([
            { key: "safe", label: "SAFE", activeClass: "bg-[color:var(--leaf-green)]/15 text-[var(--leaf-green)]" },
            { key: "moderate", label: "MODERATE RISK", activeClass: "bg-[color:var(--golden-yellow)]/15 text-[var(--golden-yellow)]" },
            { key: "evacuate", label: "EVACUATE NOW", activeClass: "bg-[color:var(--terracotta)]/15 text-[var(--terracotta)]" },
          ] as const).map(({ key, label, activeClass }) => (
            <button key={key} type="button" suppressHydrationWarning onClick={() => setScenario(key)} className="flex-1 py-2">
              <span className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-[6px] px-2 py-1 text-[10px] font-medium tracking-[0.1em] transition-colors",
                scenario === key ? activeClass : "text-[var(--text-muted)]"
              )}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Bulletin Card Area */}
        {isLoadingBulletin ? (
          <div className="relative mt-4 overflow-hidden rounded-r-xl border-l-4 border-[var(--leaf-green)] bg-[var(--surface)]">
            <div className="pointer-events-none absolute inset-0 bg-[var(--leaf-green)] opacity-5" />
            <div className="relative space-y-4 p-5">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--leaf-green)]" />
                <span className="text-[15px] font-normal text-[var(--text-body)]">{progressMessage}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--leaf-green)] opacity-60" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* SAFE card */}
            {scenario === "safe" && (
              <div className="relative mt-4 overflow-hidden rounded-r-xl border-l-4 border-[var(--leaf-green)] bg-[var(--surface)]">
                <div className="pointer-events-none absolute inset-0 bg-[var(--leaf-green)] opacity-10" />
                <div className="relative space-y-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="block text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">STATUS</span>
                      <h2 className="text-[48px] font-extrabold leading-[1.1] text-white">SAFE</h2>
                    </div>
                    <div className="flex max-w-[140px] shrink-0 items-center gap-2 rounded-full border border-[var(--leaf-green)] bg-[color:var(--leaf-green)]/20 px-2 py-1">
                      {isTranslating && <Loader2 className="h-3 w-3 animate-spin text-[var(--leaf-green)]" aria-hidden />}
                      <span className="truncate text-[11px] font-medium uppercase text-[var(--leaf-green)]">
                        {showLiveSafe ? confidenceLabel : "Data Confidence High"}
                      </span>
                    </div>
                  </div>
                  <hr className="border-white/10" />
                  <p className="text-[15px] font-normal leading-[1.5] text-[var(--text-body)]">
                    {showLiveSafe ? currentBulletinText : DEMO_TEXT.safe}
                  </p>
                  <div className="space-y-2 pt-2">
                    <span className="block text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">RECOMMENDED ACTION</span>
                    <div className="flex items-center justify-between">
                      <p className="text-[17px] font-bold text-white">{showLiveSafe ? currentAction : DEMO_ACTION.safe}</p>
                      <button type="button" onClick={() => window.location.href = "/history"} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <ActionRow />
                </div>
              </div>
            )}

            {/* MODERATE RISK card */}
            {scenario === "moderate" && (
              <div className="relative mt-4 overflow-hidden rounded-r-xl border-l-4 border-[var(--golden-yellow)] bg-[var(--surface)]">
                <div className="pointer-events-none absolute inset-0 bg-[var(--golden-yellow)] opacity-10" />
                <div className="relative space-y-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="block text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">STATUS</span>
                      <h2 className="text-[clamp(1.8rem,7vw,3rem)] font-extrabold leading-[1.1] whitespace-nowrap text-[var(--golden-yellow)]">
                        MODERATE RISK
                      </h2>
                    </div>
                    <div className="max-w-[140px] shrink-0 rounded-full border border-[var(--golden-yellow)] bg-[color:var(--golden-yellow)]/20 px-2 py-1">
                      <span className="truncate text-[11px] font-medium uppercase text-[var(--golden-yellow)]">
                        {showLiveModerate ? confidenceLabel : "Advisory Active"}
                      </span>
                    </div>
                  </div>
                  <hr className="border-white/10" />
                  <p className="text-[15px] font-normal leading-[1.5] text-[var(--text-body)]">
                    {showLiveModerate ? currentBulletinText : DEMO_TEXT.moderate}
                  </p>
                  <div className="space-y-2 pt-2">
                    <span className="block text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">RECOMMENDED ACTION</span>
                    <div className="flex items-center justify-between">
                      <p className="text-[17px] font-bold text-white">{showLiveModerate ? currentAction : DEMO_ACTION.moderate}</p>
                      <button type="button" onClick={() => window.location.href = "/history"} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <ActionRow />
                </div>
              </div>
            )}

            {/* EVACUATE NOW card */}
            {scenario === "evacuate" && (
              <div className="relative mt-4 overflow-hidden rounded-r-xl border-l-4 border-[var(--terracotta)] bg-[var(--surface)]">
                <div className="pointer-events-none absolute inset-0 bg-[var(--terracotta)] opacity-10" />
                <div className="relative space-y-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-2">
                      <span className="block text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">STATUS</span>
                      <h2 className="text-[clamp(1.8rem,7vw,3rem)] font-extrabold leading-[1.1] whitespace-nowrap text-[var(--terracotta)]">
                        EVACUATE NOW
                      </h2>
                      <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-[color:var(--terracotta)]/40 bg-[color:var(--terracotta)]/15 px-3 py-1">
                        <AlertTriangle className="h-4 w-4 text-[var(--terracotta)]" />
                        <span className="text-[11px] font-medium tracking-[0.1em] text-[var(--terracotta)]">LANDFALL IN</span>
                        <span className="text-[13px] font-bold text-white tabular-nums" suppressHydrationWarning>
                          {landfallReady ? landfallClock : "--:--:--"}
                        </span>
                      </div>
                    </div>
                    <div className="max-w-[140px] shrink-0 rounded-full border border-[var(--terracotta)] bg-[color:var(--terracotta)]/20 px-2 py-1">
                      <span className="truncate text-[11px] font-medium uppercase text-[var(--terracotta)]">
                        {showLiveEvacuate ? confidenceLabel : "Emergency Bulletin"}
                      </span>
                    </div>
                  </div>
                  <hr className="border-white/10" />
                  <p className="text-[15px] font-normal leading-[1.5] text-[var(--text-body)]">
                    {showLiveEvacuate ? currentBulletinText : DEMO_TEXT.evacuate}
                  </p>
                  <div className="flex items-center justify-between gap-4 pt-2">
                    <button type="button" suppressHydrationWarning className="h-11 w-full rounded-lg border border-[color:var(--terracotta)]/50 bg-[color:var(--terracotta)]/20 px-4 text-[13px] font-bold tracking-[0.06em] text-white transition-transform active:scale-95">
                      VIEW SHELTERS
                    </button>
                  </div>
                  <div className="space-y-2 pt-2">
                    <span className="block text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">RECOMMENDED ACTION</span>
                    <div className="flex items-center justify-between">
                      <p className="text-[17px] font-bold text-white">{showLiveEvacuate ? currentAction : DEMO_ACTION.evacuate}</p>
                      <button type="button" onClick={() => window.location.href = "/history"} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <ActionRow />
                </div>
              </div>
            )}
          </>
        )}

        {/* 72-HR RISK FORECAST */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h3 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">72-HR RISK FORECAST</h3>
            <span className="text-[11px] font-medium text-[var(--leaf-green)]">STABLE TREND</span>
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
              <div key={id} className="flex w-24 flex-shrink-0 flex-col items-center gap-2 rounded-xl border border-white/8 bg-[var(--surface-raised)] p-3">
                <span className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">{time}</span>
                <Icon className="h-5 w-5 text-[var(--leaf-green)]" />
                <span className="text-[11px] font-medium text-[var(--leaf-green)]">SAFE</span>
                <span className="text-[13px] font-normal text-[var(--text-muted)]">{rain}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Data Attribution */}
        <div className="mt-8 flex flex-wrap gap-2 opacity-60">
          {["PAGASA", "NASA POWER", "NOAA", "PHIVOLCS"].map((src) => (
            <div key={src} className="rounded border border-white/10 bg-white/5 px-2 py-1">
              <span className="text-[9px] font-bold text-[var(--text-muted)]">{src}</span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}