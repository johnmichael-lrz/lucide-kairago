"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "ENGLISH" | "FILIPINO" | "CEBUANO";

const STORAGE_KEY = "kairago-language";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  isHydrated: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): AppLanguage | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "ENGLISH" || raw === "FILIPINO" || raw === "CEBUANO") return raw;
  return null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("ENGLISH");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredLanguage();
    if (stored) setLanguageState(stored);
    setIsHydrated(true);
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
      window.dispatchEvent(new CustomEvent("kairago-language-updated", { detail: lang }));
    }
  }, []);

  const value = useMemo(() => ({ language, setLanguage, isHydrated }), [language, setLanguage, isHydrated]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

