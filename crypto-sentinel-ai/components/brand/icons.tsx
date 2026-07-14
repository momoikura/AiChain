/**
 * Custom monoline HUD icon set for Sentinel navigation. Terminal/cybersecurity
 * language — reticles, radar, nodes, hexagons — one consistent 1.6 stroke,
 * `currentColor` so they theme + glow. Deliberately not stock Lucide.
 */
import type { SVGProps } from "react";

type P = { size?: number } & SVGProps<SVGSVGElement>;

function Svg({ size = 20, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Command Center — targeting reticle grid. */
export const IcCommand = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    <circle cx="12" cy="12" r="2.4" />
  </Svg>
);

/** Signal Feed — radar arcs. */
export const IcSignals = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="1.6" />
    <path d="M12 12 A5 5 0 0 1 17 12" />
    <path d="M12 12 A9 9 0 0 1 21 12" />
    <path d="M12 12 L20 6" />
  </Svg>
);

/** Meme Radar — spark diamond. */
export const IcMeme = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z" />
  </Svg>
);

/** Token Universe — hex coin. */
export const IcToken = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" />
    <path d="M9 9.5l3-1.5 3 1.5v3l-3 1.5-3-1.5z" />
  </Svg>
);

/** Network Map — node cluster. */
export const IcNetwork = (p: P) => (
  <Svg {...p}>
    <circle cx="6" cy="7" r="2" />
    <circle cx="18" cy="8" r="2" />
    <circle cx="12" cy="18" r="2" />
    <path d="M7.6 8.4L11 16.4M16.4 9.2L13 16.4M8 7.4h8" />
  </Svg>
);

/** Portfolio — secure vault. */
export const IcVault = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="M3.5 9.5h17" />
    <circle cx="16.5" cy="14" r="1.6" />
  </Svg>
);

/** Automation — circuit chip. */
export const IcAutomation = (p: P) => (
  <Svg {...p}>
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
    <path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3" />
    <circle cx="12" cy="12" r="1.4" />
  </Svg>
);

/** Data Sources — stacked layers. */
export const IcSources = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l8 4-8 4-8-4z" />
    <path d="M4 12l8 4 8-4M4 17l8 4 8-4" />
  </Svg>
);

/** Settings — hex gear. */
export const IcSettings = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 5v2M12 17v2M19 8.5l-1.7 1M6.7 14.5l-1.7 1M5 8.5l1.7 1M17.3 14.5l1.7 1" />
  </Svg>
);

/** Operator / profile — identity node. */
export const IcOperator = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" />
    <circle cx="12" cy="10" r="2.4" />
    <path d="M8 16.5c0-2.2 1.8-3.4 4-3.4s4 1.2 4 3.4" />
  </Svg>
);

/** Command palette — terminal prompt. */
export const IcTerminal = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <path d="M7 10l3 2.5-3 2.5M12.5 15.5H16" />
  </Svg>
);

/** Threat — hazard reticle. */
export const IcThreat = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5l8.5 15H3.5z" />
    <path d="M12 9v4" />
    <circle cx="12" cy="15.6" r="0.6" fill="currentColor" stroke="none" />
  </Svg>
);

/** Pulse — signal waveform. */
export const IcPulse = (p: P) => (
  <Svg {...p}>
    <path d="M3 12h4l2-6 3 12 2-8 2 2h5" />
  </Svg>
);

/** Search — magnifier + reticle. */
export const IcSearch = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="M11 8v6M8 11h6M20 20l-4.5-4.5" />
  </Svg>
);

/** Functional glyphs — same HUD stroke language. */
export const IcCheck = (p: P) => (
  <Svg {...p}><path d="M4 12.5l5 5L20 6.5" /></Svg>
);
export const IcClose = (p: P) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
);
export const IcChevron = (p: P) => (
  <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>
);
export const IcArrowUpRight = (p: P) => (
  <Svg {...p}><path d="M7 17L17 7M8 7h9v9" /></Svg>
);
export const IcClock = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></Svg>
);
export const IcFlame = (p: P) => (
  <Svg {...p}><path d="M12 3c1 3-2 4-2 7a2 2 0 104 0c0-1 .5-1.5 1-2 1 2 2 3 2 5a5 5 0 11-10 0c0-4 3-6 5-10z" /></Svg>
);
export const IcTrend = (p: P) => (
  <Svg {...p}><path d="M3 16l5-5 3 3 6-7M14 7h4v4" /></Svg>
);
export const IcShield = (p: P) => (
  <Svg {...p}><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></Svg>
);
export const IcLock = (p: P) => (
  <Svg {...p}><rect x="5.5" y="10.5" width="13" height="9" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" /></Svg>
);
export const IcBolt = (p: P) => (
  <Svg {...p}><path d="M13 3L5 13h5l-1 8 8-11h-5z" /></Svg>
);
export const IcKey = (p: P) => (
  <Svg {...p}><circle cx="8" cy="8" r="4" /><path d="M11 11l8 8M16 16l2-2M18.5 18.5l1.5-1.5" /></Svg>
);
export const IcBiometric = (p: P) => (
  <Svg {...p}><path d="M7 11a5 5 0 0110 0v1M9 12v2a3 3 0 006 0M12 12v3M6 8a8 8 0 0112 0" /></Svg>
);
export const IcBell = (p: P) => (
  <Svg {...p}><path d="M6 10a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 004 0" /></Svg>
);
export const IcLogout = (p: P) => (
  <Svg {...p}><path d="M14 6V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h6a2 2 0 002-2v-1M9 12h11M17 9l3 3-3 3" /></Svg>
);
