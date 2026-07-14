"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IcCommand,
  IcSignals,
  IcMeme,
  IcToken,
  IcNetwork,
  IcVault,
  IcAutomation,
  IcSources,
  IcSettings,
  IcOperator,
  IcSearch,
} from "@/components/brand/icons";
import { classNames } from "@/lib/format";

/** Fire from anywhere: window.dispatchEvent(new Event("sentinel:command")) */
const OPEN_EVENT = "sentinel:command";

type Item = {
  id: string;
  label: string;
  sub: string;
  href: string;
  icon: React.ReactNode;
  kw?: string;
};

const NAV: Item[] = [
  { id: "cmd", label: "Command Center", sub: "dashboard", href: "/", icon: <IcCommand size={18} />, kw: "home dashboard mission control" },
  { id: "sig", label: "Signal Feed", sub: "alerts", href: "/signals", icon: <IcSignals size={18} />, kw: "alerts signals feed" },
  { id: "meme", label: "Meme Radar", sub: "meme intel", href: "/memes", icon: <IcMeme size={18} />, kw: "meme radar" },
  { id: "tok", label: "Token Universe", sub: "all tokens", href: "/tokens", icon: <IcToken size={18} />, kw: "tokens universe list" },
  { id: "net", label: "Network Map", sub: "3D constellation", href: "/network", icon: <IcNetwork size={18} />, kw: "network wallet constellation graph" },
  { id: "port", label: "Portfolio", sub: "pnl · trades", href: "/portfolio", icon: <IcVault size={18} />, kw: "portfolio wallet pnl trades" },
  { id: "auto", label: "Automation", sub: "trading rules", href: "/automation", icon: <IcAutomation size={18} />, kw: "automation rules trading bot" },
  { id: "src", label: "Data Sources", sub: "38 providers", href: "/sources", icon: <IcSources size={18} />, kw: "sources providers apis" },
  { id: "prof", label: "Operator Console", sub: "identity", href: "/profile", icon: <IcOperator size={18} />, kw: "profile operator identity account" },
  { id: "set", label: "Settings", sub: "security · keys", href: "/settings", icon: <IcSettings size={18} />, kw: "settings security keys notifications" },
];

const SYMBOLS = ["SOL", "ARB", "JUP", "ENA", "TIA", "SEI", "PYTH", "OP", "INJ", "AAVE", "LDO", "SUI", "WIF", "PEPE", "BONK", "POPCAT", "BRETT", "MEW", "FLOKI", "SHIB", "TURBO", "MOG"];

const TOKEN_ITEMS: Item[] = SYMBOLS.map((s) => ({
  id: `t-${s}`,
  label: s,
  sub: "open token dossier",
  href: `/tokens/${s}`,
  icon: <IcToken size={18} />,
  kw: "token " + s,
}));

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global open triggers: Cmd/Ctrl+K, or the custom event from nav buttons.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const pool = [...NAV, ...TOKEN_ITEMS];
    if (!query) return NAV;
    return pool
      .filter((i) => (i.label + " " + i.sub + " " + (i.kw ?? "")).toLowerCase().includes(query))
      .slice(0, 12);
  }, [q]);

  useEffect(() => setActive(0), [q]);

  function go(item: Item) {
    setOpen(false);
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center bg-black/70 p-3 pt-[12vh] backdrop-blur-sm sm:pt-[16vh]"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="glass hud w-full max-w-lg animate-fadeUp overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-signal-green/15 px-4 py-3">
          <span className="text-signal-green/70">
            <IcSearch size={18} />
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tokens, screens, actions…"
            className="w-full bg-transparent font-mono text-sm text-white placeholder:text-signal-green/30 focus:outline-none"
            aria-label="Search"
          />
          <kbd className="hidden rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white/40 sm:block">
            ESC
          </kbd>
        </div>

        <ul className="max-h-[52vh] overflow-y-auto p-1.5" data-lenis-prevent>
          {results.length === 0 && (
            <li className="px-3 py-6 text-center font-mono text-[12px] text-white/40">
              &gt; no matches
            </li>
          )}
          {results.map((item, i) => (
            <li key={item.id}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item)}
                className={classNames(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                  i === active ? "bg-signal-green/12 text-white shadow-[inset_0_0_0_1px_rgba(0,255,65,0.25)]" : "text-white/70"
                )}
              >
                <span className={classNames(i === active ? "text-signal-green" : "text-white/40")}>{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.label}</span>
                  <span className="block truncate font-mono text-[11px] text-white/35">{item.sub}</span>
                </span>
                {i === active && <span className="font-mono text-[10px] text-signal-green/60">↵</span>}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-signal-green/15 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-signal-green/40">
          <span>sentinel · command</span>
          <span>↑↓ navigate · ↵ open</span>
        </div>
      </div>
    </div>
  );
}
