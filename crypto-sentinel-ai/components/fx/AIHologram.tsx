"use client";

import { useEffect, useState } from "react";
import { TypeText } from "./TypeText";
import { classNames } from "@/lib/format";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { IcClose, IcAutomation } from "@/components/brand/icons";

/**
 * SENTINEL — floating AI hologram assistant. Idles with a float + rotating
 * reticle rings + scan sweep + blink. Tap to open the analysis stream: a
 * drag-to-dismiss bottom sheet on mobile, a floating terminal panel on desktop.
 */

const TIPS = [
  "Cross-validating signals across 8 independent sectors…",
  "No alert fires from social buzz alone — on-chain corroboration required.",
  "Whale accumulation + exchange outflows raise confidence.",
  "Meme radar: watching supply concentration & LP locks.",
  "Every score is probabilistic evidence — not financial advice.",
  "Type a token symbol in search (⌘K) to open its intel dossier.",
];

export function AIHologram() {
  const [open, setOpen] = useState(false);
  const [tip, setTip] = useState(0);
  const [blink, setBlink] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

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

  const stream = (
    <div className="space-y-2 text-[13px] leading-relaxed text-signal-green/85">
      <div className="text-[10px] uppercase tracking-widest text-signal-green/40">// analysis stream</div>
      <p key={tip} className="min-h-[3.5em]">
        <span className="text-signal-green/40">&gt;</span> <TypeText text={TIPS[tip]} speed={22} />
      </p>
    </div>
  );

  return (
    <>
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 lg:bottom-6 lg:right-6">
        {/* Desktop floating panel */}
        {!mobile && open && (
          <div className="glass hud w-[min(84vw,320px)] animate-fadeUp overflow-hidden rounded-xl">
            <div className="terminal-bar">
              <span className="terminal-dot bg-signal-green" />
              <span className="terminal-dot bg-signal-yellow" />
              <span className="terminal-dot bg-signal-red" />
              <span className="ml-1">sentinel.ai — assistant</span>
              <button onClick={() => setOpen(false)} className="ml-auto text-signal-green/60 hover:text-signal-green" aria-label="Close">
                <IcClose size={14} />
              </button>
            </div>
            <div className="p-3">{stream}</div>
          </div>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="SENTINEL AI assistant"
          className="group relative h-14 w-14 animate-floatY"
        >
          <span className="absolute inset-0 animate-spinSlow rounded-full border border-signal-green/40" />
          <span className="absolute inset-1 rounded-full border border-dashed border-accent-cyan/40" style={{ animation: "spinSlow 24s linear infinite reverse" }} />
          <span className="absolute inset-2.5 rounded-full bg-gradient-to-br from-signal-green/30 to-accent-cyan/20 shadow-glow backdrop-blur" />
          <span className={classNames("absolute inset-0 flex items-center justify-center text-signal-green transition", blink ? "opacity-30" : "opacity-100")}>
            <span className="drop-shadow-[0_0_6px_rgba(0,255,65,0.8)]">
              <IcAutomation size={20} />
            </span>
          </span>
          <span className="pointer-events-none absolute inset-2.5 overflow-hidden rounded-full">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-scanline bg-gradient-to-b from-signal-green/25 to-transparent" />
          </span>
        </button>
      </div>

      {/* Mobile: drag-to-dismiss bottom sheet */}
      {mobile && (
        <BottomSheet open={open} onClose={() => setOpen(false)} title="sentinel.ai — assistant">
          {stream}
        </BottomSheet>
      )}
    </>
  );
}
