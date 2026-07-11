"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Activity, ShieldCheck, LogOut } from "lucide-react";

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
      setClock(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          timeZone: "UTC",
        }) + " UTC"
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-white/8 bg-base-950/60 px-5 backdrop-blur-xl">
      {/* Mobile brand */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-signal-green to-accent-cyan">
          <ShieldCheck className="h-4 w-4 text-base-950" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold">Sentinel</span>
      </div>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          placeholder="Search tokens, wallets, signals…"
          className="w-full rounded-xl border border-white/8 bg-white/[0.03] py-2 pl-9 pr-4 text-sm text-white/90 placeholder:text-white/30 focus:border-signal-green/40 focus:outline-none focus:ring-1 focus:ring-signal-green/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs sm:flex">
          <Activity className="h-3.5 w-3.5 text-signal-green" />
          <span className="tabular text-white/70">{clock || "—"}</span>
        </div>
        <button className="relative rounded-lg border border-white/8 bg-white/[0.03] p-2 text-white/60 transition hover:text-white">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-signal-red shadow-glowRed" />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] py-1.5 pl-2 pr-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-signal-violet to-signal-blue text-[10px] font-bold">
            {initials(user?.name ?? "User")}
          </div>
          <span className="hidden max-w-[120px] truncate text-xs font-medium text-white/70 sm:block">
            {user?.name ?? "Account"}
          </span>
          <button
            onClick={logout}
            disabled={loggingOut}
            title="Sign out"
            className="rounded-md p-1 text-white/40 transition hover:bg-white/5 hover:text-signal-red disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
