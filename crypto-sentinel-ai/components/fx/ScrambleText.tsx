"use client";

import { useEffect, useRef, useState } from "react";
import { classNames } from "@/lib/format";

const CHARS = "ｱｲｳｴｵ01!<>-_\\/[]{}=+*#ABCDEF";

/**
 * Decrypt/scramble reveal — glyphs resolve left→right into the target text.
 *
 * Robust by design: the initial (and SSR) value is the REAL text, so if the
 * client effect never runs the heading still reads correctly (never stuck on
 * placeholder glyphs). On mount it scrambles from a masked state and resolves,
 * with a safety timeout that force-resolves even if rAF is throttled.
 */
export function ScrambleText({
  text,
  className,
  duration = 900,
  as: Tag = "span",
  start = true,
}: {
  text: string;
  className?: string;
  duration?: number;
  as?: any;
  start?: boolean;
}) {
  const [display, setDisplay] = useState(text);
  const ran = useRef(false);

  useEffect(() => {
    if (!start || ran.current) return;
    ran.current = true;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // leave the real text in place

    let raf = 0;
    const startT = performance.now();
    setDisplay(text.replace(/[^ ]/g, "░"));

    const tick = (now: number) => {
      const p = Math.min(1, (now - startT) / duration);
      const revealed = Math.floor(p * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " ") out += " ";
        else if (i < revealed) out += text[i];
        else out += CHARS[(Math.random() * CHARS.length) | 0];
      }
      setDisplay(out);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    raf = requestAnimationFrame(tick);

    // Safety: guarantee resolution even if rAF is paused/throttled.
    const safety = setTimeout(() => {
      cancelAnimationFrame(raf);
      setDisplay(text);
    }, duration + 500);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
    };
  }, [text, duration, start]);

  return <Tag className={classNames("tabular", className)}>{display}</Tag>;
}
