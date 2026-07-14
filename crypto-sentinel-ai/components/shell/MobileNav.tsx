"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IcCommand, IcSignals, IcVault, IcOperator, IcTerminal } from "@/components/brand/icons";
import { classNames } from "@/lib/format";

/**
 * Floating Command Dock — the mobile primary navigation. A floating glass pill
 * (not a full-width bar) with 4 top-level destinations flanking an elevated
 * central Command button that opens the palette (search-everywhere reaches all
 * other screens). Safe-area aware; every target ≥44px. Hidden on desktop (lg),
 * where the sidebar takes over.
 */
const TABS = [
  { href: "/", label: "Home", Icon: IcCommand },
  { href: "/signals", label: "Signals", Icon: IcSignals },
  { href: "/portfolio", label: "Wallet", Icon: IcVault },
  { href: "/profile", label: "Operator", Icon: IcOperator },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Primary"
    >
      <div className="glass hud flex items-center gap-1 rounded-full border-signal-green/20 px-2 py-1.5 shadow-glow">
        <DockItem tab={TABS[0]} pathname={pathname} />
        <DockItem tab={TABS[1]} pathname={pathname} />

        {/* Central command button */}
        <button
          onClick={() => window.dispatchEvent(new Event("sentinel:command"))}
          aria-label="Open command palette"
          className="relative mx-0.5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-signal-green to-accent-cyan text-base-950 shadow-glow transition active:scale-95"
        >
          <span className="absolute inset-0 animate-pulseRing rounded-full" />
          <IcTerminal size={22} />
        </button>

        <DockItem tab={TABS[2]} pathname={pathname} />
        <DockItem tab={TABS[3]} pathname={pathname} />
      </div>
    </nav>
  );
}

function DockItem({
  tab,
  pathname,
}: {
  tab: { href: string; label: string; Icon: (p: { size?: number }) => JSX.Element };
  pathname: string;
}) {
  const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
  const { Icon } = tab;
  return (
    <Link
      href={tab.href}
      aria-label={tab.label}
      aria-current={active ? "page" : undefined}
      className={classNames(
        "relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full transition active:scale-95",
        active ? "text-signal-green" : "text-white/45"
      )}
    >
      <span className={active ? "drop-shadow-[0_0_6px_rgba(0,255,65,0.7)]" : ""}>
        <Icon size={20} />
      </span>
      <span className="text-[9px] font-medium leading-none">{tab.label}</span>
      {active && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-signal-green shadow-glow" />}
    </Link>
  );
}
