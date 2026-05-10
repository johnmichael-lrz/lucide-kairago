import Image from "next/image";
import { UserCircle } from "lucide-react";

interface HeaderProps {
  onProfileClick?: () => void;
}

export function Header({ onProfileClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--surface)]">
      <div className="flex h-14 w-full items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Kairago"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="tracking-tight text-[24px] font-bold text-[var(--on-surface)]">
            Kairago
          </span>
        </div>

        <button
          type="button"
          suppressHydrationWarning
          aria-label="Profile"
          onClick={onProfileClick}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/5 active:scale-95"
        >
          <UserCircle className="h-6 w-6 text-[var(--text-muted)]" aria-hidden />
        </button>
      </div>
    </header>
  );
}