"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated number count-up. Counts 0→value once on mount (data "materializes"),
 * then reflects live prop changes instantly. SSR-safe (renders 0, animates on
 * hydrate); honors reduced-motion.
 */
export function CountUp({
  value,
  duration = 1100,
  className,
  format,
}: {
  value: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) {
      setDisplay(value);
      return;
    }
    done.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const shown = format ? format(display) : Math.round(display).toString();
  return <span className={className}>{shown}</span>;
}
