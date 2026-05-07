export type KairagoSettings = {
  criticalRiskAlerts: boolean;
  lowBandwidthMode: boolean;
  largeText: boolean;
  highContrast: boolean;
  autoTextToSpeech: boolean;
};

export type KairagoBarangays = {
  items: string[];
  default?: string;
};

const SETTINGS_KEY = "kairago-settings";
const BARANGAYS_KEY = "kairago-barangays";

export const DEFAULT_SETTINGS: KairagoSettings = {
  criticalRiskAlerts: true,
  lowBandwidthMode: false,
  largeText: false,
  highContrast: false,
  autoTextToSpeech: false,
};

export const DEFAULT_BARANGAYS: KairagoBarangays = {
  items: ["Santa Rosa", "San Lorenzo", "Don Bosco"],
};

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readKairagoSettings(): KairagoSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const parsed = safeParseJson<Partial<KairagoSettings>>(
    window.localStorage.getItem(SETTINGS_KEY)
  );
  return { ...DEFAULT_SETTINGS, ...(parsed ?? {}) };
}

export function writeKairagoSettings(settings: KairagoSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(
    new CustomEvent("kairago-settings-updated", { detail: settings })
  );
}

export function readKairagoBarangays(): KairagoBarangays {
  if (typeof window === "undefined") return DEFAULT_BARANGAYS;
  const parsed = safeParseJson<Partial<KairagoBarangays>>(
    window.localStorage.getItem(BARANGAYS_KEY)
  );
  const items = Array.isArray(parsed?.items) ? parsed!.items : undefined;
  const next: KairagoBarangays = {
    items: items && items.length > 0 ? items : DEFAULT_BARANGAYS.items,
    default: typeof parsed?.default === "string" ? parsed.default : undefined,
  };
  return next;
}

export function writeKairagoBarangays(value: KairagoBarangays) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BARANGAYS_KEY, JSON.stringify(value));
  window.dispatchEvent(
    new CustomEvent("kairago-barangays-updated", { detail: value })
  );
}

