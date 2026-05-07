"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Map, History, Info, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/map", label: "Map", Icon: Map },
  { href: "/history", label: "History", Icon: History },
  { href: "/about", label: "About", Icon: Info },
  { href: "/settings", label: "Settings", Icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex h-[64px] w-full max-w-[640px] -translate-x-1/2 items-center justify-around border-t border-white/12 bg-[var(--surface)] px-2 pb-[env(safe-area-inset-bottom)]">
      {navItems.map(({ href, label, Icon }) => {
        const isActive = pathname === href;

        return (
          <button
            key={href}
            type="button"
            suppressHydrationWarning
            onClick={() => router.push(href)}
            className={cn(
              "flex flex-col items-center justify-center transition-colors active:scale-90 duration-150",
              isActive
                ? "text-[var(--leaf-green)]"
                : "text-[var(--text-muted)] hover:text-[var(--on-surface)]"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={cn("h-5 w-5", isActive && "scale-105")}
              strokeWidth={isActive ? 2.6 : 2}
            />
            <span className="mt-1 text-[11px] font-medium tracking-[0.1em]">
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
