"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radar,
  Sparkles,
  Wallet,
  Bot,
} from "lucide-react";
import { classNames } from "@/lib/format";

/**
 * Mobile bottom tab bar. The desktop sidebar is hidden below `lg`, so this is
 * the primary navigation on phones/tablets. Fixed to the bottom with iOS
 * safe-area padding; app content reserves space via `pb` in the layout.
 */
const TABS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/signals", label: "Signals", icon: Radar },
  { href: "/memes", label: "Memes", icon: Sparkles },
  { href: "/portfolio", label: "Wallet", icon: Wallet },
  { href: "/automation", label: "Auto", icon: Bot },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-base-950/85 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={classNames(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition",
                active ? "text-signal-green" : "text-white/45 active:text-white/80"
              )}
            >
              <span
                className={classNames(
                  "flex h-8 w-full items-center justify-center",
                  active && "relative"
                )}
              >
                {active && (
                  <span className="absolute -top-2.5 h-0.5 w-8 rounded-full bg-signal-green shadow-glow" />
                )}
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.9} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
