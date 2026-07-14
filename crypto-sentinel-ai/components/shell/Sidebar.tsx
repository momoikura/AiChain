"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/format";
import { SOURCES } from "@/lib/sources/registry";
import { LogoLockup } from "@/components/brand/Logo";
import {
  IcCommand,
  IcSignals,
  IcMeme,
  IcToken,
  IcNetwork,
  IcVault,
  IcAutomation,
  IcSources,
  IcOperator,
  IcSettings,
} from "@/components/brand/icons";

type IconType = (p: { size?: number; className?: string }) => JSX.Element;

const NAV: { href: string; label: string; icon: IconType }[] = [
  { href: "/", label: "Command Center", icon: IcCommand },
  { href: "/signals", label: "Signal Feed", icon: IcSignals },
  { href: "/memes", label: "Meme Radar", icon: IcMeme },
  { href: "/tokens", label: "Token Universe", icon: IcToken },
  { href: "/network", label: "Network Map", icon: IcNetwork },
  { href: "/portfolio", label: "Portfolio", icon: IcVault },
  { href: "/automation", label: "Automation", icon: IcAutomation },
  { href: "/profile", label: "Operator Console", icon: IcOperator },
  { href: "/sources", label: "Data Sources", icon: IcSources },
  { href: "/settings", label: "Settings", icon: IcSettings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/8 bg-base-950/70 backdrop-blur-xl lg:flex">
      <div className="px-5 py-5">
        <LogoLockup />
      </div>

      <nav className="mt-1 flex-1 space-y-1 overflow-y-auto px-3" data-lenis-prevent>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={classNames(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-signal-green/10 text-white shadow-[inset_0_0_0_1px_rgba(0,255,65,0.25)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white/90"
              )}
            >
              <span
                className={classNames(
                  "transition",
                  active
                    ? "text-signal-green drop-shadow-[0_0_6px_rgba(0,255,65,0.6)]"
                    : "text-white/40 group-hover:text-white/70"
                )}
              >
                <Icon size={18} />
              </span>
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
