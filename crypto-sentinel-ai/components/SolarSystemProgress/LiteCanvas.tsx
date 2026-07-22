"use client";

import { useEffect, useMemo, useRef } from "react";
import { subscribeTick } from "./ticker";
import { paletteFor, TAU, ORBIT_TILT, SPACE_BG } from "./constants";
import { damp } from "./state";
import type { AlertLevel } from "@/lib/types";

/**
 * Canvas2D solar system — the tier that ships inside list views.
 *
 * This is a faithful 2D projection of the same scene the WebGL tier renders:
 * identical orbit geometry (an ellipse of ry = rx·cos(tilt)), identical progress
 * mapping, identical palette, and the same real occlusion — the star is drawn
 * behind the planet on the far half of its orbit and in front on the near half.
 *
 * It exists because at list sizes (~78px) the WebGL tier's PBR detail resolves
 * to well under a pixel while still costing a full WebGL context, and browsers
 * cap those at ~8–16 per page. This costs one shared rAF callback instead.
 */

/** Trail segment count and its precomputed fade curve — constant across
 *  instances and frames, so it is built once at module load. */
const TRAIL_SEGMENTS = 12;
const TRAIL_STEP = 1 / TRAIL_SEGMENTS;
const TRAIL_FADE = Array.from({ length: TRAIL_SEGMENTS }, (_, i) =>
  Math.pow(1 - i * TRAIL_STEP, 2.4)
);

/** Ambient motion reads identically at 30fps and costs half as much. */
const LITE_FPS = 30;

interface Particle {
  a: number;
  r: number;
  speed: number;
  size: number;
  seed: number;
}
interface Star {
  x: number;
  y: number;
  size: number;
  seed: number;
}

export function LiteCanvas({
  score,
  size,
  level,
  animated,
  hovered,
}: {
  score: number;
  size: number;
  level: AlertLevel;
  animated: boolean;
  hovered: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const palette = useMemo(() => paletteFor(level), [level]);

  const target = Math.max(0, Math.min(100, score)) / 100;
  const stateRef = useRef({ progress: animated ? 0 : target, glow: 0 });
  const targetRef = useRef(target);
  const hoveredRef = useRef(hovered);

  targetRef.current = target;
  hoveredRef.current = hovered;

  // Field generated once per instance; deterministic per mount.
  const field = useMemo(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < 14; i++) {
      particles.push({
        a: Math.random() * TAU,
        r: 0.62 + Math.random() * 0.5,
        speed: (0.08 + Math.random() * 0.16) * (Math.random() > 0.5 ? 1 : -1),
        size: 0.35 + Math.random() * 0.8,
        seed: Math.random(),
      });
    }
    const stars: Star[] = [];
    for (let i = 0; i < 26; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.pow(Math.random(), 2.2) * 1.15 + 0.28,
        seed: Math.random(),
      });
    }
    return { particles, stars };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const cx = size / 2;
    const cy = size / 2;
    const planetR = size * 0.205;
    const orbitRx = size * 0.395;
    const orbitRy = orbitRx * Math.cos(ORBIT_TILT);

    // Gradients are rebuilt only on size/palette change, never per frame.
    // Each is authored around the origin so draws can translate into place.
    const planetGrad = ctx.createRadialGradient(
      -planetR * 0.38,
      -planetR * 0.4,
      planetR * 0.08,
      0,
      0,
      planetR
    );
    planetGrad.addColorStop(0, palette.atmos);
    planetGrad.addColorStop(0.22, palette.land);
    planetGrad.addColorStop(0.68, palette.ocean);
    planetGrad.addColorStop(1, "#010406");

    const atmosGrad = ctx.createRadialGradient(0, 0, planetR * 0.9, 0, 0, planetR * 1.42);
    atmosGrad.addColorStop(0, `${palette.atmos}00`);
    atmosGrad.addColorStop(0.42, `${palette.atmos}2e`);
    atmosGrad.addColorStop(1, `${palette.atmos}00`);

    const starGlowR = size * 0.13;
    const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, starGlowR);
    starGrad.addColorStop(0, "#ffffff");
    starGrad.addColorStop(0.16, palette.key);
    starGrad.addColorStop(0.45, `${palette.corona}88`);
    starGrad.addColorStop(1, `${palette.corona}00`);

    const nebulaGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.55);
    nebulaGrad.addColorStop(0, `${palette.ocean}66`);
    nebulaGrad.addColorStop(0.6, `${palette.ocean}22`);
    nebulaGrad.addColorStop(1, "#00000000");

    // Static: was previously rebuilt on every frame, which allocated one
    // gradient object per instance per frame.
    const termGrad = ctx.createLinearGradient(-planetR, -planetR, planetR, planetR);
    termGrad.addColorStop(0, "#00000000");
    termGrad.addColorStop(0.52, "#00000055");
    termGrad.addColorStop(1, "#000000b8");

    /** Point on the orbital ellipse for progress p (0 = top, clockwise). */
    const orbitAt = (p: number) => {
      const th = -Math.PI / 2 + p * TAU;
      return { x: cx + Math.cos(th) * orbitRx, y: cy + Math.sin(th) * orbitRy, th };
    };

    const draw = (t: number, dt: number) => {
      const st = stateRef.current;
      if (animated) {
        st.progress = damp(st.progress, targetRef.current, 3.1, dt);
        st.glow = damp(st.glow, hoveredRef.current ? 1 : 0, 6, dt);
      } else {
        st.progress = targetRef.current;
        st.glow = 0;
      }
      const p = st.progress;
      const glow = st.glow;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // --- Deep space -------------------------------------------------------
      ctx.fillStyle = SPACE_BG;
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, TAU);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, TAU);
      ctx.clip();

      // Drifting nebula.
      ctx.save();
      ctx.translate(cx + Math.sin(t * 0.05) * size * 0.06, cy + Math.cos(t * 0.04) * size * 0.05);
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(-size, -size, size * 2, size * 2);
      ctx.restore();

      // Twinkling starfield.
      for (const s of field.stars) {
        const tw = 0.45 + 0.4 * Math.sin(t * (0.8 + s.seed * 1.7) + s.seed * 30);
        ctx.globalAlpha = Math.max(0.05, tw) * 0.8;
        ctx.fillStyle = s.seed > 0.75 ? palette.atmos : "#c9d8ff";
        ctx.fillRect(s.x * size, s.y * size, s.size, s.size);
      }
      ctx.globalAlpha = 1;

      // --- Orbit guide ring -------------------------------------------------
      ctx.beginPath();
      ctx.ellipse(cx, cy, orbitRx, orbitRy, 0, 0, TAU);
      ctx.strokeStyle = `${palette.atmos}1f`;
      ctx.lineWidth = Math.max(0.6, size * 0.008);
      ctx.stroke();

      // Outer hairline for structural depth.
      ctx.beginPath();
      ctx.ellipse(cx, cy, orbitRx * 1.085, orbitRy * 1.085, 0, 0, TAU);
      ctx.strokeStyle = `${palette.atmos}12`;
      ctx.lineWidth = Math.max(0.5, size * 0.005);
      ctx.stroke();

      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + p * TAU;
      const star = orbitAt(p);
      // Far half of the orbit — the star passes behind the planet here.
      const behind = Math.sin(star.th) < 0;

      // --- Completed arc ----------------------------------------------------
      if (p > 0.001) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, orbitRx, orbitRy, 0, startAngle, endAngle);
        ctx.strokeStyle = `${palette.key}${glow > 0.5 ? "8c" : "6b"}`;
        ctx.lineWidth = Math.max(0.8, size * 0.011);
        ctx.stroke();

        // --- Plasma trail ---------------------------------------------------
        // Short bright tail immediately behind the star, drawn as decaying
        // segments so it fades along the arc rather than ending abruptly.
        // Opacity goes through globalAlpha rather than an "#rrggbbaa" string:
        // building those per segment allocated hundreds of short-lived strings
        // every frame once a page carried a couple of dozen instances.
        const tailSpan = Math.min(p, 0.19) * TAU;
        ctx.lineCap = "round";
        ctx.strokeStyle = palette.key;
        for (let i = 0; i < TRAIL_SEGMENTS; i++) {
          const f0 = i * TRAIL_STEP;
          const a0 = endAngle - tailSpan * (f0 + TRAIL_STEP);
          const a1 = endAngle - tailSpan * f0;
          const fade = TRAIL_FADE[i];
          const flicker = 0.85 + 0.15 * Math.sin(t * 6 + i * 0.7);
          ctx.globalAlpha = fade * flicker * 0.86;
          ctx.beginPath();
          ctx.ellipse(cx, cy, orbitRx, orbitRy, 0, a0, a1);
          ctx.lineWidth = Math.max(0.8, size * 0.02 * fade + size * 0.006);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.lineCap = "butt";
      }

      // --- Star behind the planet ------------------------------------------
      const drawStar = () => {
        const flicker = 1 + 0.07 * Math.sin(t * 9.3);
        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.globalCompositeOperation = "lighter";
        ctx.scale(flicker * (1 + glow * 0.14), flicker * (1 + glow * 0.14));
        ctx.fillStyle = starGrad;
        ctx.beginPath();
        ctx.arc(0, 0, starGlowR, 0, TAU);
        ctx.fill();
        // Hot core.
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.9, size * 0.017), 0, TAU);
        ctx.fill();
        ctx.restore();
        ctx.globalCompositeOperation = "source-over";
      };

      if (behind) drawStar();

      // --- Planet -----------------------------------------------------------
      ctx.save();
      ctx.translate(cx, cy);

      // Atmospheric halo.
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.7 + glow * 0.3;
      ctx.fillStyle = atmosGrad;
      ctx.beginPath();
      ctx.arc(0, 0, planetR * 1.42, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // Surface.
      ctx.beginPath();
      ctx.arc(0, 0, planetR, 0, TAU);
      ctx.fillStyle = planetGrad;
      ctx.fill();

      // Cloud bands, clipped to the sphere and drifting slowly.
      ctx.save();
      ctx.clip();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = palette.atmos;
      for (let i = 0; i < 3; i++) {
        const drift = ((t * 0.02 + i * 0.37) % 1) * 2 - 1;
        const by = (i - 1) * planetR * 0.44;
        ctx.beginPath();
        ctx.ellipse(
          drift * planetR * 0.55,
          by,
          planetR * 0.78,
          planetR * 0.14,
          0,
          0,
          TAU
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Terminator: darken the side facing away from the key light.
      ctx.beginPath();
      ctx.arc(0, 0, planetR, 0, TAU);
      ctx.fillStyle = termGrad;
      ctx.fill();

      // Rim light.
      ctx.beginPath();
      ctx.arc(0, 0, planetR, 0, TAU);
      ctx.strokeStyle = `${palette.atmos}${glow > 0.5 ? "6a" : "44"}`;
      ctx.lineWidth = Math.max(0.6, size * 0.009);
      ctx.stroke();

      ctx.restore();

      // --- Star in front of the planet --------------------------------------
      if (!behind) drawStar();

      // --- Orbital dust -----------------------------------------------------
      ctx.globalCompositeOperation = "lighter";
      for (const d of field.particles) {
        const a = d.a + t * d.speed;
        const px = cx + Math.cos(a) * orbitRx * d.r;
        const py = cy + Math.sin(a) * orbitRy * d.r;
        ctx.globalAlpha = (0.12 + glow * 0.34) * (0.5 + 0.5 * Math.sin(t * 0.8 + d.seed * 12));
        ctx.fillStyle = palette.corona;
        ctx.beginPath();
        ctx.arc(px, py, d.size, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      ctx.restore();
    };

    if (!animated) {
      // Static tier: render one high-quality frame, then never touch the GPU again.
      draw(0, 0);
      return;
    }

    return subscribeTick(draw, LITE_FPS);
  }, [size, palette, animated, field]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full rounded-full"
    />
  );
}
