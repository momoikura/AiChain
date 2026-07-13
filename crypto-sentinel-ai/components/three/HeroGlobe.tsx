"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const GlobeScene = dynamic(() => import("./GlobeScene"), {
  ssr: false,
  loading: () => <FallbackRing />,
});

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/** Lightweight CSS stand-in when 3D is unavailable or reduced-motion is on. */
function FallbackRing() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-[280px] w-[280px]">
        <div className="absolute inset-0 animate-spinSlow rounded-full border border-signal-green/30" />
        <div className="absolute inset-6 rounded-full border border-dashed border-accent-cyan/25" style={{ animation: "spinSlow 30s linear infinite reverse" }} />
        <div className="absolute inset-10 rounded-full bg-signal-green/5 blur-2xl" />
        <div className="absolute inset-0 rounded-full bg-grid-faint" style={{ backgroundSize: "18px 18px", opacity: 0.25, maskImage: "radial-gradient(circle, black 55%, transparent 70%)" }} />
      </div>
    </div>
  );
}

/**
 * Client wrapper for the 3D globe: detects WebGL + reduced-motion, scales
 * quality to the device, and lazy-loads the heavy Three.js bundle (ssr:false)
 * so it never blocks first paint. Always renders *something* (CSS fallback).
 */
export function HeroGlobe({ className }: { className?: string }) {
  const [state, setState] = useState<{ on: boolean; quality: number }>({
    on: false,
    quality: 1,
  });

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !hasWebGL()) {
      setState({ on: false, quality: 1 });
      return;
    }
    const small = window.innerWidth < 768;
    const cores = navigator.hardwareConcurrency || 8;
    const quality = small ? 0.5 : cores <= 4 ? 0.7 : 1;
    setState({ on: true, quality });
  }, []);

  // R3F measures its container on mount; if the lazy Three.js chunk resolves
  // while the box is still settling, it caches a 0-size (300×150 default) and
  // never corrects (the box never actually resizes afterward). We can't know
  // exactly when the chunk mounts, so poll a resize nudge until the canvas
  // reports a real size, then stop.
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!state.on) return;
    let n = 0;
    const id = setInterval(() => {
      window.dispatchEvent(new Event("resize"));
      const c = wrapRef.current?.querySelector("canvas");
      if ((c && c.width > 320) || ++n > 14) clearInterval(id);
    }, 350);
    return () => clearInterval(id);
  }, [state.on]);

  return (
    <div ref={wrapRef} className={className}>
      {state.on ? <GlobeScene quality={state.quality} /> : <FallbackRing />}
    </div>
  );
}
