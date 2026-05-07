"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, MoreVertical, Pin, Plus } from "lucide-react";
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
import { useLanguage, type AppLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
  const [settings, setSettings] = useState<KairagoSettings>(DEFAULT_SETTINGS);
  const { language, setLanguage } = useLanguage();
  const [barangays, setBarangays] = useState<KairagoBarangays>({
    items: [],
  });
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

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

  const saveSettings = (next: KairagoSettings) => {
    setSettings(next);
    writeKairagoSettings(next);
  };

  const Toggle = (props: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    ariaLabel: string;
  }) => {
    return (
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={props.checked}
          onChange={(e) => props.onChange(e.target.checked)}
          aria-label={props.ariaLabel}
        />
        <span className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-[#4ADE80]" />
        <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </label>
    );
  };

  const defaultLabel = useMemo(() => {
    if (!barangays.default) return null;
    return barangays.default;
  }, [barangays.default]);

  const setDefault = (name: string) => {
    const next = { ...barangays, default: name };
    setBarangays(next);
    writeKairagoBarangays(next);
    setOpenMenuFor(null);
  };

  const removeBarangay = (name: string) => {
    const nextItems = barangays.items.filter((b) => b !== name);
    const next: KairagoBarangays = {
      items: nextItems.length > 0 ? nextItems : [],
      default: barangays.default === name ? undefined : barangays.default,
    };
    setBarangays(next);
    writeKairagoBarangays(next);
    setOpenMenuFor(null);
  };

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-[640px] space-y-6 px-4 pb-24 pt-6 antialiased selection:bg-[color:var(--leaf-green)]/30">
        {/* Header Section */}
        <header className="mb-8">
          <h1 className="text-[24px] font-bold text-[var(--text-primary)]">
            Settings
          </h1>
          <p className="mt-1 text-[13px] font-normal text-[var(--text-muted)]">
            Personalize your alert intelligence experience
          </p>
        </header>

        {/* Group 1: LANGUAGE */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
            LANGUAGE
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[var(--surface)]">
            <label className="flex cursor-pointer items-center justify-between border-b border-white/5 p-4 transition-colors hover:bg-[var(--surface-bright)]">
              <span className="text-[15px] font-normal">English</span>
              <input
                checked={language === "ENGLISH"}
                onChange={() => setLanguage("ENGLISH")}
                className="h-5 w-5 border-white/20 bg-[var(--surface-raised)] text-[var(--leaf-green)] focus:ring-[var(--leaf-green)] focus:ring-offset-[var(--background)]"
                type="radio"
                name="language"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between border-b border-white/5 p-4 transition-colors hover:bg-[var(--surface-bright)]">
              <span className="text-[15px] font-normal">Filipino</span>
              <input
                checked={language === "FILIPINO"}
                onChange={() => setLanguage("FILIPINO")}
                className="h-5 w-5 border-white/20 bg-[var(--surface-raised)] text-[var(--leaf-green)] focus:ring-[var(--leaf-green)] focus:ring-offset-[var(--background)]"
                type="radio"
                name="language"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-[var(--surface-bright)]">
              <span className="text-[15px] font-normal">Cebuano</span>
              <input
                checked={language === "CEBUANO"}
                onChange={() => setLanguage("CEBUANO")}
                className="h-5 w-5 border-white/20 bg-[var(--surface-raised)] text-[var(--leaf-green)] focus:ring-[var(--leaf-green)] focus:ring-offset-[var(--background)]"
                type="radio"
                name="language"
              />
            </label>
          </div>
        </section>

        {/* Group 2: LOCATION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
              LOCATION
            </h2>
            <button className="flex items-center gap-1 text-[11px] font-medium text-[var(--leaf-green)] active:opacity-70">
              <Plus className="h-[14px] w-[14px]" />
              ADD BARANGAY
            </button>
          </div>
          <div className="space-y-2">
            {barangays.items.map((loc) => (
              <div
                key={loc}
                className="flex items-center justify-between rounded-lg border border-white/12 bg-[var(--surface-raised)] p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Pin className="h-5 w-5 text-[var(--text-muted)]" />
                  <div>
                    <span className="text-[15px] font-normal">{loc}</span>
                    {defaultLabel === loc && (
                      <div className="mt-0.5 text-[11px] font-medium text-[var(--leaf-green)]">
                        Default
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuFor((prev) => (prev === loc ? null : loc))
                    }
                    aria-label="Barangay options"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {openMenuFor === loc && (
                    <div className="absolute right-0 top-10 z-50 w-40 overflow-hidden rounded-lg border border-white/10 bg-[var(--surface)] shadow-xl">
                      <button
                        type="button"
                        onClick={() => setDefault(loc)}
                        className="block w-full px-4 py-3 text-left text-[13px] text-white hover:bg-white/5"
                      >
                        Set as default
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBarangay(loc)}
                        className="block w-full px-4 py-3 text-left text-[13px] text-[var(--terracotta)] hover:bg-white/5"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Group 3: NOTIFICATIONS */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
            NOTIFICATIONS
          </h2>
          <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 bg-[var(--surface)]">
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-normal">Critical Risk Alerts</span>
              <Toggle
                checked={settings.criticalRiskAlerts}
                onChange={(checked) =>
                  saveSettings({ ...settings, criticalRiskAlerts: checked })
                }
                ariaLabel="Critical Risk Alerts"
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-normal">Low-Bandwidth Mode</span>
              <Toggle
                checked={settings.lowBandwidthMode}
                onChange={(checked) =>
                  saveSettings({ ...settings, lowBandwidthMode: checked })
                }
                ariaLabel="Low-Bandwidth Mode"
              />
            </div>
          </div>
        </section>

        {/* Group 4: ACCESSIBILITY */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
            ACCESSIBILITY
          </h2>
          <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 bg-[var(--surface)]">
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-normal">Large Text</span>
              <Toggle
                checked={settings.largeText}
                onChange={(checked) => saveSettings({ ...settings, largeText: checked })}
                ariaLabel="Large Text"
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-normal">High Contrast</span>
              <Toggle
                checked={settings.highContrast}
                onChange={(checked) =>
                  saveSettings({ ...settings, highContrast: checked })
                }
                ariaLabel="High Contrast"
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-normal">Auto Text-to-Speech</span>
              <Toggle
                checked={settings.autoTextToSpeech}
                onChange={(checked) =>
                  saveSettings({ ...settings, autoTextToSpeech: checked })
                }
                ariaLabel="Auto Text-to-Speech"
              />
            </div>
          </div>
        </section>

        {/* Group 5: APP INFORMATION */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)]">
            APP INFORMATION
          </h2>
          <div className="space-y-4 rounded-xl border border-white/5 bg-[var(--surface-container-low)] p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium text-[var(--text-muted)]">
                  VERSION
                </p>
                <p className="text-[15px] font-bold">1.0.0</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[var(--text-muted)]">
                  BUILD
                </p>
                <p className="text-[15px] font-bold">CodeKada 2026</p>
              </div>
            </div>
            <div className="border-t border-white/5 pt-4">
              <p className="mb-1 text-[11px] font-medium text-[var(--text-muted)]">
                LICENSE
              </p>
              <p className="text-[15px] font-normal">MIT License</p>
            </div>
            <button className="flex w-full items-center justify-between py-2 text-[15px] transition-opacity active:opacity-50">
              <span>Open Source Licenses</span>
              <ChevronRight className="h-5 w-5 text-[var(--text-muted)]" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="pb-12 pt-8 text-center">
          <p className="text-[11px] font-medium tracking-[0.2em] text-[var(--text-muted)] opacity-60">
            DESIGNED FOR SURVIVAL AND CLARITY
          </p>
        </footer>
      </main>
    </>
  );
}

