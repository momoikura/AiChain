"use client";

import { useEffect, useState } from "react";

export type Tier = "cinematic" | "lite" | "static";

/**
 * WebGL context budget.
 *
 * Browsers hard-cap live WebGL contexts (~16 desktop, as low as 8 on mobile
 * Safari) and silently kill the oldest one past the limit — the scene turns
 * black. This component renders inside unbounded `.map()` lists, so cinematic
 * instances draw from a shared budget and anything past it degrades to the
 * Canvas2D tier instead of taking the whole page down.
 */
const MAX_CINEMATIC = 4;
let claimed = 0;

function claim(): boolean {
  if (claimed >= MAX_CINEMATIC) return false;
  claimed += 1;
  return true;
}
function release() {
  claimed = Math.max(0, claimed - 1);
}

let webglSupport: boolean | null = null;
function supportsWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    webglSupport = !!gl;
    // Release immediately — this probe must not consume a real context.
    const lose = (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context");
    lose?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/** Coarse device capability check. Deliberately conservative on mobile. */
function isLowPower(): boolean {
  if (typeof navigator === "undefined") return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === "number" && mem <= 4) return true;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true;
  return false;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    // Safari < 14 only has the deprecated listener API.
    if (mq.addEventListener) {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);
  return reduced;
}

/**
 * Resolve the render tier for one instance.
 *
 * `requested` lets a caller force a tier; otherwise the tier is derived from
 * reduced-motion, WebGL availability, device class, component size and the
 * remaining context budget.
 */
export function useTier(size: number, requested?: Tier, active = true): Tier {
  const reduced = usePrefersReducedMotion();
  const [granted, setGranted] = useState(false);

  // Cinematic is only worth its cost above ~88px; below that the PBR detail is
  // literally sub-pixel and the Canvas2D tier is indistinguishable.
  const wantsCinematic =
    active && !reduced && (requested === "cinematic" || (requested === undefined && size >= 88));

  useEffect(() => {
    if (!wantsCinematic) return;
    if (!supportsWebGL() || isLowPower()) return;
    if (!claim()) return;
    setGranted(true);
    return () => {
      release();
      setGranted(false);
    };
  }, [wantsCinematic]);

  if (reduced) return "static";
  if (requested === "lite" || requested === "static") return requested;
  return granted ? "cinematic" : "lite";
}

/** Mounts children only once they have been on screen, and reports visibility so
 *  offscreen instances can stop rendering entirely. */
export function useInView<T extends HTMLElement>(ref: React.RefObject<T>, rootMargin = "200px") {
  const [inView, setInView] = useState(false);
  const [everSeen, setEverSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      setEverSeen(true);
      return;
    }
    let reported = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        reported = true;
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setEverSeen(true);
      },
      { rootMargin }
    );
    io.observe(el);

    // Fail open. Some embedded webviews, print contexts and offscreen
    // compositing environments never deliver a callback at all — and gating
    // rendering on an event that never arrives leaves a permanently frozen
    // scene, which is a far worse failure than mounting something eagerly.
    // Cinematic instances stay protected by the size gate and context budget.
    const fallback = window.setTimeout(() => {
      if (reported) return;
      setInView(true);
      setEverSeen(true);
    }, 400);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [ref, rootMargin]);

  return { inView, everSeen };
}
