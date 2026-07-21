"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { IcSearch, IcBell, IcLogout, IcPulse } from "@/components/brand/icons";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

export function Topbar({ user }: { user?: { name: string; email: string } }) {
  const [clock, setClock] = useState<string>("");
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" }) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const openPalette = () => window.dispatchEvent(new Event("sentinel:command"));

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/8 bg-base-950/60 px-4 backdrop-blur-xl sm:gap-4 sm:px-5">
      {/* Mobile brand */}
      <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="Sentinel home">
        <Logo size={30} />
        <span className="text-sm font-bold tracking-tight">SENTINEL</span>
      </Link>

      {/* Search → command palette (both desktop input and mobile icon) */}
      <button
        onClick={openPalette}
        className="group ml-auto hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] py-2 pl-3 pr-2 text-left text-sm text-white/40 transition hover:border-signal-green/40 md:ml-0 md:flex"
        aria-label="Open command palette"
      >
        <IcSearch size={16} />
        <span className="flex-1 truncate">Search tokens, screens, actions…</span>
        <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white/40">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2 sm:gap-3 md:ml-0">
        <button
          onClick={openPalette}
          aria-label="Search"
          className="rounded-lg border border-white/8 bg-white/[0.03] p-2 text-white/60 transition hover:text-signal-green md:hidden"
        >
          <IcSearch size={18} />
        </button>

        <div className="hidden items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs sm:flex">
          <span className="text-signal-green"><IcPulse size={14} /></span>
          <span className="tabular text-white/70">{clock || "—"}</span>
        </div>

        <button
          aria-label="Notifications"
          className="relative rounded-lg border border-signal-green/15 bg-signal-green/[0.03] p-2 text-signal-green/50 transition hover:border-signal-green/40 hover:text-signal-green"
        >
          <IcBell size={16} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-signal-red shadow-glowRed ring-2 ring-base-950" />
        </button>

        <div className="flex items-center gap-1.5 rounded-lg border border-signal-green/15 bg-signal-green/[0.03] py-1 pl-1.5 pr-1">
          <Link href="/profile" className="group flex items-center gap-2" aria-label="Operator console">
            <span className="relative flex h-7 w-7 items-center justify-center rounded-md border border-signal-green/40 bg-signal-green/10 font-mono text-[10px] font-bold text-signal-green shadow-[0_0_8px_rgba(0,255,65,0.25)] transition group-hover:border-signal-green/70 group-hover:shadow-[0_0_12px_rgba(0,255,65,0.4)]">
              {initials(user?.name ?? "User")}
              <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-signal-green shadow-glow ring-2 ring-base-950" />
            </span>
            <span className="hidden max-w-[120px] truncate font-mono text-xs font-medium text-signal-green/70 group-hover:text-signal-green sm:block">
              {user?.name ?? "Account"}
            </span>
          </Link>
          <button
            onClick={logout}
            disabled={loggingOut}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-md p-1.5 text-signal-green/40 transition hover:bg-signal-red/10 hover:text-signal-red disabled:opacity-50"
          >
            <IcLogout size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
