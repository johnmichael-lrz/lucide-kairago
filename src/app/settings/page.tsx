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

  return (
    <>
      <Header onProfileClick={() => setShowProfileModal(true)} />

      {/* ADD BARANGAY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setSearchQuery(""); setSuggestions([]); }}>
          <div className="w-full max-w-[640px] mx-auto rounded-t-[24px] border-t border-white/12 bg-[var(--surface)] shadow-[0_-8px_40px_rgba(0,0,0,0.7)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            <div className="px-6 pb-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[17px] font-bold text-white">Add Barangay</h3>
                <button onClick={() => { setShowAddModal(false); setSearchQuery(""); setSuggestions([]); }} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-white/10">
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
          <div className="w-full max-w-[640px] mx-auto rounded-t-[24px] border-t border-white/12 bg-[var(--surface)] shadow-[0_-8px_40px_rgba(0,0,0,0.7)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-white/20"