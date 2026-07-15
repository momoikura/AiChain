"use client";

import { useEffect, useRef, useState } from "react";
import { MatrixRain } from "./MatrixRain";
import { Logo } from "@/components/brand/Logo";
import { ScrambleText } from "./ScrambleText";

/**
 * Full-screen terminal boot sequence. Plays once per browser session
 * (sessionStorage gate), then dissolves to reveal the app. Click / any key
 * skips it. Honors reduced-motion by resolving instantly.
 */

const LINES = [
  "[  OK  ] mounting /dev/sentinel-core",
  "[  OK  ] establishing quantum-secure uplink … 4096-bit",
  "[ .... ] decrypting classified intelligence streams",
  "[  OK  ] synchronizing 43 data sources across 8 sectors",
  "[  OK  ] loading on-chain clustering engine",
  "[  OK  ] spinning up multi-stage confidence model",
  "[ WARN ] social channels: corroboration required (guardrail active)",
  "[  OK  ] AI hologram · SENTINEL online",
  "ACCESS GRANTED — welcome, operator.",
];

export function BootSequence() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lineCount, setLineCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [closing, setClosing] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    // Only render on the client, once per session.
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("sentinel_booted")) return;
    setMounted(true);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      finish();
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setLineCount(i + 1), 180 + i * 230));
    });
    const total = 180 + LINES.length * 230 + 500;
    const startT = performance.now();
    let raf = 0;
    const grow = (now: number) => {
      const p = Math.min(100, ((now - startT) / total) * 100);
      setProgress(p);
      if (p < 100) raf = requestAnimationFrame(grow);
      else finish();
    };
    raf = requestAnimationFrame(grow);

    const skip = () => finish();
    window.addEventListener("keydown", skip);
    window.addEventListener("click", skip);

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("click", skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    if (done.current) return;
    done.current = true;
    try {
      sessionStorage.setItem("sentinel_booted", "1");
    } catch {}
    setClosing(true);
    setTimeout(() => setVisible(false), 450);
  }

  if (!mounted || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black transition-opacity duration-500"
      style={{ opacity: closing ? 0 : 1 }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <MatrixRain opacity={0.6} fontSize={16} fps={24} />
      </div>
      <div className="crt-overlay" />

      <div className="relative z-10 w-full max-w-2xl px-6 font-mono">
        {/* Logo motion-reveal: emblem scales/decodes in, wordmark descrambles */}
        <div className="mb-5 flex items-center gap-3">
          <div
            className="drop-shadow-[0_0_18px_rgba(0,255,65,0.65)]"
            style={{ animation: "fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            <Logo size={54} />
          </div>
          <div className="leading-tight">
            <ScrambleText
              as="div"
              text="SENTINEL"
              className="phosphor text-xl font-bold tracking-[0.22em]"
              duration={950}
            />
            <div className="text-[10px] uppercase tracking-[0.35em] text-signal-green/50">
              cyber intelligence os
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-signal-green/70">
          <span className="h-2 w-2 animate-pulse rounded-full bg-signal-green" />
          crypto sentinel ai · secure boot
        </div>

        <div className="min-h-[220px] space-y-1.5 text-[13px] leading-relaxed">
          {LINES.slice(0, lineCount).map((l, i) => (
            <div
              key={i}
              className={
                l.includes("WARN")
                  ? "text-signal-yellow"
                  : l.includes("ACCESS GRANTED")
                  ? "phosphor text-base font-bold"
                  : "text-signal-green/85"
              }
            >
              <span className="text-signal-green/40">$</span> {l}
            </div>
          ))}
          <span className="caret" />
        </div>

        <div className="mt-6">
          <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-signal-green/50">
            <span>decrypting</span>
            <span className="tabular">{Math.floor(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full border border-signal-green/20 bg-black">
            <div
              className="h-full bg-gradient-to-r from-signal-green to-accent-cyan"
              style={{ width: `${progress}%`, boxShadow: "0 0 12px rgba(0,255,65,0.6)" }}
            />
          </div>
          <div className="mt-3 text-center text-[10px] text-signal-green/30">
            press any key to skip
          </div>
        </div>
      </div>
    </div>
  );
}
