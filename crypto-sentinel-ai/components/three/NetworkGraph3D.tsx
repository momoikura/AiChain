"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ConstellationScene = dynamic(() => import("./ConstellationScene"), {
  ssr: false,
  loading: () => <Fallback />,
});

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

function Fallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-64 w-64">
        <div className="absolute inset-0 animate-spinSlow rounded-full border border-signal-green/25" />
        <div className="absolute inset-8 rounded-full bg-grid-faint" style={{ backgroundSize: "16px 16px", opacity: 0.3, maskImage: "radial-gradient(circle, black 50%, transparent 72%)" }} />
      </div>
    </div>
  );
}

/**
 * Lazy client wrapper for the 3D constellation. Same guards as HeroGlobe:
 * WebGL + reduced-motion detection, adaptive quality, ssr:false lazy load, and
 * a resize-nudge until R3F measures its real container size.
 */
export function NetworkGraph3D({ className }: { className?: string }) {
  const [state, setState] = useState<{ on: boolean; quality: number }>({ on: false, quality: 1 });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !hasWebGL()) {
      setState({ on: false, quality: 1 });
      return;
    }
    const small = window.innerWidth < 768;
    const cores = navigator.hardwareConcurrency || 8;
    setState({ on: true, quality: small ? 0.55 : cores <= 4 ? 0.75 : 1 });
  }, []);

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
      {state.on ? <ConstellationScene quality={state.quality} /> : <Fallback />}
    </div>
  );
}
