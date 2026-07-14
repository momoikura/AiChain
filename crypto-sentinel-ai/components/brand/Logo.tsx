import { classNames } from "@/lib/format";

/**
 * SENTINEL brand mark — a custom monoline emblem fusing:
 *   hexagon (secure node) · radar eye (intelligence) · terminal cursor (hacker)
 *   · circuit traces (blockchain). Neon-green phosphor with glow.
 *
 * `animated` adds a rotating radar sweep + pulsing core (pauses under
 * prefers-reduced-motion via the tailwind animations). Pure SVG → crisp at any
 * size, themeable, used for nav, boot, favicon and splash.
 */
export function Logo({
  size = 36,
  animated = true,
  className,
  title = "Sentinel",
}: {
  size?: number;
  animated?: boolean;
  className?: string;
  title?: string;
}) {
  const hex = hexPoints(32, 32, 27);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
      style={{ filter: "drop-shadow(0 0 5px rgba(0,255,65,0.55))" }}
    >
      {/* circuit traces to three vertices */}
      <g stroke="#00ff41" strokeWidth="1" opacity="0.5" strokeLinecap="round">
        <path d="M32 32 L32 8" />
        <path d="M32 32 L53 44" />
        <path d="M32 32 L11 44" />
        <circle cx="32" cy="8" r="1.6" fill="#00ff41" stroke="none" />
        <circle cx="53" cy="44" r="1.6" fill="#00ff41" stroke="none" />
        <circle cx="11" cy="44" r="1.6" fill="#00ff41" stroke="none" />
      </g>

      {/* hexagon shell */}
      <polygon points={hex} fill="rgba(0,255,65,0.05)" stroke="#00ff41" strokeWidth="2.2" strokeLinejoin="round" />

      {/* radar rings */}
      <circle cx="32" cy="32" r="15" fill="none" stroke="#00ff41" strokeWidth="1" opacity="0.35" />
      <circle cx="32" cy="32" r="9" fill="none" stroke="#00ffe0" strokeWidth="1" opacity="0.35" />

      {/* rotating radar sweep */}
      <g className={classNames(animated && "animate-spinSlow")} style={{ transformOrigin: "32px 32px" }}>
        <path d="M32 32 L32 15 A17 17 0 0 1 46 24 Z" fill="#00ff41" opacity="0.16" />
        <line x1="32" y1="32" x2="32" y2="15" stroke="#00ff41" strokeWidth="1.4" />
      </g>

      {/* terminal cursor core */}
      <rect
        x="29"
        y="29"
        width="6"
        height="6"
        rx="1"
        fill="#00ff41"
        className={classNames(animated && "animate-pulse")}
      />
    </svg>
  );
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** Wordmark lockup: emblem + glitch SENTINEL + subtitle. */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <div className={classNames("flex items-center gap-2.5", className)}>
      <Logo size={36} />
      <div className="leading-tight">
        <div className="glitch text-sm font-bold uppercase tracking-tight text-white" data-text="SENTINEL">
          SENTINEL
        </div>
        <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-signal-green phosphor">
          cyber intel
        </div>
      </div>
    </div>
  );
}
