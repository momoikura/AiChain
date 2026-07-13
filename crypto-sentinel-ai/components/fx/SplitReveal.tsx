"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { classNames } from "@/lib/format";

/**
 * GSAP letter-by-letter headline choreography. Splits text into per-character
 * spans and staggers them in with a 3D flip + blur (SplitText-style, done with
 * a manual split so it needs no premium plugin). Honors reduced-motion.
 */
export function SplitReveal({
  text,
  className,
  as: Tag = "h1",
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: any;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chars = el.querySelectorAll("[data-char]");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      gsap.set(chars, { opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.from(chars, {
        opacity: 0,
        yPercent: 60,
        rotateX: -90,
        filter: "blur(6px)",
        transformPerspective: 700,
        transformOrigin: "50% 100%",
        stagger: 0.028,
        duration: 0.7,
        ease: "power3.out",
        delay,
      });
    }, el);
    return () => ctx.revert();
  }, [text, delay]);

  return (
    <Tag ref={ref} className={classNames("tabular", className)} aria-label={text}>
      {text.split("").map((ch: string, i: number) => (
        <span key={i} data-char aria-hidden className="inline-block">
          {ch === " " ? " " : ch}
        </span>
      ))}
    </Tag>
  );
}
