"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radar,
  Coins,
  Sparkles,
  Waypoints,
  Wallet,
  Bot,
  Database,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { classNames } from "@/lib/format";
import { SOURCES } from "@/lib/sources/registry";

const NAV = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/signals", label: "Signal Feed", icon: Radar },
  { href: "/memes", label: "Meme Radar", icon: Sparkles },
  { href: "/tokens", label: "Token Universe", icon: Coins },
  { href: "/network", label: "Network Map", icon: Waypoints },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/automation", label: "Automation", icon: Bot },
  { href: "/sources", label: "Data Sources", icon: Database },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/8 bg-base-950/70 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-signal-green to-accent-cyan shadow-glow">
          <ShieldCheck className="h-5 w-5 text-base-950" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div
            className="glitch text-sm font-bold uppercase tracking-tight text-white"
            data-text="SENTINEL"
          >
            SENTINEL
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-signal-green phosphor">
            cyber intel
          </div>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={classNames(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-signal-green/10 text-white shadow-[inset_0_0_0_1px_rgba(34,227,155,0.25)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white/90"
              )}
            >
              <Icon
                className={classNames(
                  "h-[18px] w-[18px] transition",
                  active ? "text-signal-green" : "text-white/40 group-hover:text-white/70"
                )}
                strokeWidth={2}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-signal-green">
          <span className="h-2 w-2 animate-pulse rounded-full bg-signal-green" />
          ENGINE ONLINE
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-white/40">
          {SOURCES.length} sources fused · $0 to run · cross-validated in real time. Not financial
          advice.
        </p>
      </div>
    </aside>
  );
}
