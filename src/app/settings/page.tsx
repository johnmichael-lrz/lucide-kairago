import {
  Activity,
  UserCircle,
  Plus,
  Pin,
  GripVertical,
  ChevronRight,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      {/* Top App Bar */}
      <header className="fixed left-1/2 top-0 z-[60] flex h-14 w-full max-w-screen-sm -translate-x-1/2 items-center justify-between border-b border-white/10 bg-[var(--surface)] px-4">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-[var(--primary)]" />
          <span className="tracking-tight text-[24px] font-bold text-[var(--on-surface)]">
            Kairago
          </span>
        </div>
        <button className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-bright)] active:scale-95">
          <UserCircle className="h-6 w-6 text-[var(--primary)]" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-[640px] space-y-6 px-4 pb-24 pt-20 antialiased selection:bg-[color:var(--leaf-green)]/30">
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
                defaultChecked
                className="h-5 w-5 border-white/20 bg-[var(--surface-raised)] text-[var(--leaf-green)] focus:ring-[var(--leaf-green)] focus:ring-offset-[var(--background)]"
                type="radio"
                name="language"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between border-b border-white/5 p-4 transition-colors hover:bg-[var(--surface-bright)]">
              <span className="text-[15px] font-normal">Filipino</span>
              <input
                className="h-5 w-5 border-white/20 bg-[var(--surface-raised)] text-[var(--leaf-green)] focus:ring-[var(--leaf-green)] focus:ring-offset-[var(--background)]"
                type="radio"
                name="language"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-[var(--surface-bright)]">
              <span className="text-[15px] font-normal">Cebuano</span>
              <input
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
            {["Brgy San Jose", "Brgy Maligaya"].map((loc) => (
              <div
                key={loc}
                className="flex items-center justify-between rounded-lg border border-white/12 bg-[var(--surface-raised)] p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Pin className="h-5 w-5 text-[var(--text-muted)]" />
                  <span className="text-[15px] font-normal">{loc}</span>
                </div>
                <GripVertical className="h-5 w-5 cursor-grab text-[var(--text-muted)]" />
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
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 accent-[var(--leaf-green)]"
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-normal">Low-Bandwidth Mode</span>
              <input type="checkbox" className="h-5 w-5 accent-[var(--leaf-green)]" />
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
              <input type="checkbox" className="h-5 w-5 accent-[var(--leaf-green)]" />
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-normal">High Contrast</span>
              <input type="checkbox" className="h-5 w-5 accent-[var(--leaf-green)]" />
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-[15px] font-normal">Auto Text-to-Speech</span>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 accent-[var(--leaf-green)]"
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

