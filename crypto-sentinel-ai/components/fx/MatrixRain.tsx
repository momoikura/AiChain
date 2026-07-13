"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas Matrix rain — the signature effect.
 *
 * - Authentic half-width katakana + latin + digits glyphs.
 * - Per-column variable speed + randomized resets → organic, layered depth.
 * - Bright "head" glyph with phosphor glow; fading green trail behind it.
 * - requestAnimationFrame with a frame throttle (rain reads better slow, and
 *   it keeps the GPU/CPU cheap so the rest of the UI stays at 120fps).
 * - Pauses when the tab is hidden; honors prefers-reduced-motion; DPR-capped.
 *
 * Purely decorative → fixed, pointer-events: none, sits behind content.
 */

const GLYPHS =
  "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾚﾛﾜﾝ0123456789ABCDEFｦﾉﾘ$+=*<>#";

export function MatrixRain({
  className,
  opacity = 0.55,
  fontSize = 16,
  fps = 24,
  color = "0,255,65",
}: {
  className?: string;
  opacity?: number;
  fontSize?: number;
  fps?: number;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function setup() {
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.ceil(width / fontSize);
      drops = new Array(columns).fill(0).map(() => Math.random() * -50);
      speeds = new Array(columns).fill(0).map(() => 0.5 + Math.random() * 1.1);
      ctx!.font = `${fontSize}px "JetBrains Mono", monospace`;
      ctx!.textBaseline = "top";
    }

    function draw() {
      // Trailing fade — slightly translucent black overpaint leaves green trails.
      ctx!.fillStyle = "rgba(0,0,0,0.09)";
      ctx!.fillRect(0, 0, width, height);

      for (let i = 0; i < columns; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];

        // Bright glowing head glyph.
        ctx!.fillStyle = `rgba(200,255,210,${0.9 * opacity + 0.1})`;
        ctx!.shadowColor = `rgba(${color},0.9)`;
        ctx!.shadowBlur = 8;
        ctx!.fillText(ch, x, y);
        ctx!.shadowBlur = 0;

        // Dimmer glyph one cell up (persistence).
        ctx!.fillStyle = `rgba(${color},${0.35 * opacity})`;
        ctx!.fillText(
          GLYPHS[(Math.random() * GLYPHS.length) | 0],
          x,
          y - fontSize
        );

        if (y > height && Math.random() > 0.975) {
          drops[i] = Math.random() * -20;
          speeds[i] = 0.5 + Math.random() * 1.1;
        }
        drops[i] += speeds[i];
      }
    }

    setup();
    // Static single frame for reduced-motion users.
    if (reduce) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      for (let k = 0; k < 3; k++) draw();
      return;
    }

    let raf = 0;
    let last = 0;
    const interval = 1000 / fps;
    let running = true;

    function loop(t: number) {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (t - last < interval) return;
      last = t;
      draw();
    }
    raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(loop);
    };
    const onResize = () => setup();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, [opacity, fontSize, fps, color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
