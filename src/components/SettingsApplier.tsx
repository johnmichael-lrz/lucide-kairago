"use client";

import { useEffect } from "react";
import { readKairagoSettings } from "@/lib/kairago-storage";

function applyHtmlClasses(settings: { largeText: boolean; highContrast: boolean }) {
  const el = document.documentElement;
  el.classList.toggle("large-text", !!settings.largeText);
  el.classList.toggle("high-contrast", !!settings.highContrast);
}

export function SettingsApplier() {
  useEffect(() => {
    applyHtmlClasses(readKairagoSettings());

    const onUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      const next = ce.detail as { largeText?: boolean; highContrast?: boolean };
      applyHtmlClasses({
        largeText: !!next.largeText,
        highContrast: !!next.highContrast,
      });
    };

    window.addEventListener("kairago-settings-updated", onUpdate);
    window.addEventListener("storage", () => applyHtmlClasses(readKairagoSettings()));
    return () => {
      window.removeEventListener("kairago-settings-updated", onUpdate);
    };
  }, []);

  return null;
}

