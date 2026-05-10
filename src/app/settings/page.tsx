"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, MoreVertical, Pin, Plus, X, Search, MapPin, UserCircle, Info } from "lucide-react";
import { Header } from "@/components/Header";
import {
  DEFAULT_SETTINGS,
  readKairagoBarangays,
  readKairagoSettings,
  writeKairagoBarangays,
  writeKairagoSettings,
  type KairagoBarangays,
  type KairagoSettings,
} from "@/lib/kairago-storage";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<KairagoSettings>(DEFAULT_SETTINGS);
  const { language, setLanguage } = useLanguage();
  const [barangays, setBarangays] = useState<KairagoBarangays>({ items: [] });
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setSettings(readKairagoSettings());
    setBarangays(readKairagoBarangays());
  }, []);

  useEffect(() => {
    const onBarangaysUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail) setBarangays(ce.detail as KairagoBarangays);
      else setBarangays(readKairagoBarangays());
    };
    const onStorage = () => setBarangays(readKairagoBarangays());
    window.addEventListener("kairago-barangays-updated", onBarangaysUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("kairago-barangays-updated", onBarangaysUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSuggestions([]); return; }
    const controller = new AbortController();
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?country=PH&types=locality,neighborhood,place&access_token=${token}&limit=6`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        setSuggestions(data.features ?? []);
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery]);

  const saveSettings = (next: KairagoSettings) => {
    setSettings(next);
    writeKairagoSettings(next);
  };

  const Toggle = (props: { checked: boolean; onChange: (checked: boolean) => void; ariaLabel: string }) => (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} aria-label={props.ariaLabel} />
      <span className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-[#4ADE80]" />
      <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
    </label>
  );

  const defaultLabel = useMemo(() => barangays.default ?? null, [barangays.default]);

  const setDefault = (name: string) => {
    const next = { ...barangays, default: name };
    setBarangays(next);
    writeKairagoBarangays(next);
    setOpenMenuFor(null);
  };

  const removeBarangay = (name: string) => {
    const next: KairagoBarangays = {
      items: barangays.items.filter((b) => b !== name),
      default: barangays.default === name ? undefined : barangays.default,
    };
    setBarangays(next);
    writeKairagoBarangays(next);
    setOpenMenuFor(null);
  };

  const addBarangay = (name: string) => {
    if (!name.trim() || barangays.items.includes(name)) return;
    const next: KairagoBarangays = {
      ...barangays,
      items: [name, ...barangays.items],
    };
    setBarangays(next);
    writeKairagoBarangays(next);
    setShowAddModal(false);
    setSearchQuery("");
    setSuggestions([]);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSearchQuery("");
    setSuggestions([]);
  };

  return (
    <>
      <Header onProfileClick={() => setShowProfileModal(true)} />

      {/* ADD BARANGAY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm" onClick={closeAddModal}>
          <div className="mx-auto w-full max-w-[640px] rounded-t-[24px] border-t border-white/12 bg-[var(--surface)] shadow-[0_-8px_40px_rgba(0,0,0,0.7)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            <div className="px-6 pb-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[17px] font-bold text-white">Add Barangay</h3>
                <button onClick={closeAddModal} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search any barangay in the Philippines..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-lg border border-white/12 bg-[var(--surface-raised)] pl-10 pr-4 text-[14px] text-white placeholder-[var(--text-muted)] outline-none focus:border-[color:var(--leaf-green)]/50"
                />
              </div>
              {isSearching && (
                <p className="mb-2 text-[12px] text-[var(--text-muted)]">Searching...</p>
              )}
              <div className="max-h-[280px] overflow-y-auto">
                {suggestions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => addBarangay(s.text)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/5"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                    <div>
                      <span className="block text-[14px] text-white">{s.text}</span>
                      <span className="block text-[12px] text-[var(--text-muted)]">{s.place_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setShowProfileModal(false)}>
          <div className="mx-auto w-full max-w-[640px] rounded-t-[24px] border-t border-white/12 bg-[var(--surface)] shadow-[0_-8px_40px_rgba(0,0,0,0.7)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            <div className="px-6 pb-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-[17px] font-bold text-white">Profile</h3>
                <button onClick={() => setShowProfileModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-[var(--surface-raised)]">
                  <UserCircle className="h-10 w-10 text-[var(--text-muted)]" />
                </div>
                <div>
                  <p className="text-[17px] font-bold text-white">Guest User</p>
                  <p className="text-[13px] text-[var(--text-muted)]">Using Kairago in guest mode</p>
                </div>
              </div>
              <div className="mb-4 rounded-lg border border-white/8 bg-[var(--surface-raised)] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-[var(--leaf-green)]" />
                  <span className="text-[12px] font-medium tracking-[0.1em] text-[var(--text-muted)]">APP INFORMATION</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)]">VERSION</p>
                    <p className="text-[14px] font-bold text-white">1.0.0</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)]">BUILD</p>
                    <p className="text-[14px] font-bold text-white">CodeKada 2026</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)]">LICENSE</p>
                    <p className="text-[14px] font-bold text-white">MIT</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)]">TRACK</p>
                    <p className="text-[14px] font-bold text-[var(--leaf-green)]">Green Tech</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full rounded-lg border border-[color:var(--terracotta)]/40 bg-[color:var(--terracotta)]/10 py-3 text-[14px] font-medium text-[var(--terracotta)] transition-colors hover:bg-[color:var(--terracotta)]/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[640px] space-y-6 px-4 pb-24 pt-6 antialiased">
        <header className="mb-8">
          <h1 className="text-[24px] font-bold text-[var(--text-primary)]">Settings</h1>
          <p className="mt-1 text-[13px] font-normal text-[var(--text-muted)]">Personalize your alert intelligence experience</p>
        </header>

        {/* LANGUAGE */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">LANGUAGE</h2>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[var(--surface)]">
            {(["ENGLISH", "FILIPINO", "CEBUANO"] as const).map((lang, i, arr) => (
              <label key={lang} className={cn("flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-[var(--surface-bright)]", i < arr.length - 1 && "border-b border-white/5")}>
                <span className="text-[15px] font-normal">{lang.charAt(0) + lang.slice(1).toLowerCase()}</span>
                <input checked={language === lang} onChange={() => setLanguage(lang)} className="h-5 w-5 border-white/20 bg-[var(--surface-raised)] text-[var(--leaf-green)]" type="radio" name="language" />
              </label>
            ))}
          </div>
        </section>

        {/* LOCATION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">LOCATION</h2>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1 text-[11px] font-medium text-[var(--leaf-green)] active:opacity-70">
              <Plus className="h-[14px] w-[14px]" />
              ADD BARANGAY
            </button>
          </div>
          {barangays.items.length === 0 && (
            <p className="text-[13px] text-[var(--text-muted)]">No saved barangays. Tap Add Barangay to save a location.</p>
          )}
          <div className="space-y-2">
            {barangays.items.map((loc) => (
              <div key={loc} className="flex items-center justify-between rounded-lg border border-white/12 bg-[var(--surface-raised)] p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Pin className="h-5 w-5 text-[var(--text-muted)]" />
                  <div>
                    <span className="text-[15px] font-normal">{loc}</span>
                    {defaultLabel === loc && (
                      <div className="mt-0.5 text-[11px] font-medium text-[var(--leaf-green)]">Default</div>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <button type="button" onClick={() => setOpenMenuFor((prev) => (prev === loc ? null : loc))} aria-label="Barangay options" className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-white">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {openMenuFor === loc && (
                    <div className="absolute right-0 top-10 z-50 w-40 overflow-hidden rounded-lg border border-white/10 bg-[var(--surface)] shadow-xl">
                      <button type="button" onClick={() => setDefault(loc)} className="block w-full px-4 py-3 text-left text-[13px] text-white hover:bg-white/5">Set as default</button>
                      <button type="button" onClick={() => removeBarangay(loc)} className="block w-full px-4 py-3 text-left text-[13px] text-[var(--terracotta)] hover:bg-white/5">Remove</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">NOTIFICATIONS</h2>
          <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 bg-[var(--surface)]">
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-normal">Critical Risk Alerts</span>
              <Toggle checked={settings.criticalRiskAlerts} onChange={(checked) => saveSettings({ ...settings, criticalRiskAlerts: checked })} ariaLabel="Critical Risk Alerts" />
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-normal">Low-Bandwidth Mode</span>
              <Toggle checked={settings.lowBandwidthMode} onChange={(checked) => saveSettings({ ...settings, lowBandwidthMode: checked })} ariaLabel="Low-Bandwidth Mode" />
            </div>
          </div>
        </section>

        {/* ACCESSIBILITY */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">ACCESSIBILITY</h2>
          <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 bg-[var(--surface)]">
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-normal">Large Text</span>
              <Toggle checked={settings.largeText} onChange={(checked) => saveSettings({ ...settings, largeText: checked })} ariaLabel="Large Text" />
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-normal">High Contrast</span>
              <Toggle checked={settings.highContrast} onChange={(checked) => saveSettings({ ...settings, highContrast: checked })} ariaLabel="High Contrast" />
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-normal">Auto Text-to-Speech</span>
              <Toggle checked={settings.autoTextToSpeech} onChange={(checked) => saveSettings({ ...settings, autoTextToSpeech: checked })} ariaLabel="Auto Text-to-Speech" />
            </div>
          </div>
        </section>

        {/* APP INFORMATION */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">APP INFORMATION</h2>
          <div className="space-y-4 rounded-xl border border-white/5 bg-[var(--surface-container-low)] p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium text-[var(--text-muted)]">VERSION</p>
                <p className="text-[15px] font-bold">1.0.0</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[var(--text-muted)]">BUILD</p>
                <p className="text-[15px] font-bold">CodeKada 2026</p>
              </div>
            </div>
            <div className="border-t border-white/5 pt-4">
              <p className="mb-1 text-[11px] font-medium text-[var(--text-muted)]">LICENSE</p>
              <p className="text-[15px] font-normal">MIT License</p>
            </div>
            <button className="flex w-full items-center justify-between py-2 text-[15px] transition-opacity active:opacity-50">
              <span>Open Source Licenses</span>
              <ChevronRight className="h-5 w-5 text-[var(--text-muted)]" />
            </button>
          </div>
        </section>

        <footer className="pb-12 pt-8 text-center">
          <p className="text-[11px] font-medium tracking-[0.2em] text-[var(--text-muted)] opacity-60">DESIGNED FOR SURVIVAL AND CLARITY</p>
        </footer>
      </main>
    </>
  );
}