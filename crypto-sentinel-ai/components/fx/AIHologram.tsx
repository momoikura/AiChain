"use client";

import { useEffect, useState } from "react";
import { X, Cpu } from "lucide-react";
import { TypeText } from "./TypeText";
import { classNames } from "@/lib/format";

/**
 * SENTINEL — floating AI hologram assistant. Idles with a float + rotating
 * reticle rings + scan sweep + occasional blink. Click to open a terminal
 * panel that "thinks" and streams intelligence tips. Pure CSS/SVG (no 3D dep).
 */

const TIPS = [
  "Cross-validating signals across 8 independent sectors…",
  "No alert fires from social buzz alone — on-chain corroboration required.",
  "Whale accumulation + exchange outflows raise confidence.",
  "Meme radar: watching supply concentration & LP locks.",
  "Every score is probabilistic evidence — not financial advice.",
  "Type a token symbol in search to open its intel dossier.",
];

export function AIHologram() {
  const [open, setOpen] = useState(false);
  const [tip, setTip] = useState(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setTip((t) => (t + 1) % TIPS.length), 4600);
    return () => clearInterval(id);
  }, [open]);

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 lg:bottom-6 lg:right-6">
      {open && (
        <div className="glass hud w-[min(84vw,320px)] animate-fadeUp overflow-hidden rounded-xl">
          <div className="terminal-bar">
            <span className="terminal-dot bg-signal-green" />
            <span className="terminal-dot bg-signal-yellow" />
            <span className="terminal-dot bg-signal-red" />
            <span className="ml-1">sentinel.ai — assistant</span>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto text-signal-green/60 hover:text-signal-green"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2 p-3 text-[12px] leading-relaxed text-signal-green/85">
            <div className="text-[10px] uppercase tracking-widest text-signal-green/40">
              // analysis stream
            </div>
            <p key={tip} className="min-h-[3.5em]">
              <span className="text-signal-green/40">&gt;</span>{" "}
              <TypeText text={TIPS[tip]} speed={22} />
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="SENTINEL AI assistant"
        className="group relative h-14 w-14 animate-floatY"
      >
        {/* rotating reticle rings */}
        <span className="absolute inset-0 animate-spinSlow rounded-full border border-signal-green/40" />
        <span
          className="absolute inset-1 rounded-full border border-dashed border-accent-cyan/40"
          style={{ animation: "spinSlow 24s linear infinite reverse" }}
        />
        {/* core orb */}
        <span className="absolute inset-2.5 rounded-full bg-gradient-to-br from-signal-green/30 to-accent-cyan/20 shadow-glow backdrop-blur" />
        <span
          className={classNames(
            "absolute inset-0 flex items-center justify-center text-signal-green transition",
            blink ? "opacity-30" : "opacity-100"
          )}
        >
          <Cpu className="h-5 w-5 drop-shadow-[0_0_6px_rgba(0,255,65,0.8)]" />
        </span>
        {/* scan sweep */}
        <span className="pointer-events-none absolute inset-2.5 overflow-hidden rounded-full">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-scanline bg-gradient-to-b from-signal-green/25 to-transparent" />
        </span>
      </button>
    </div>
  );
}
