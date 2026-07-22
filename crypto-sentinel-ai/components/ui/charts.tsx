import type { AlertLevel } from "@/lib/types";
import { classNames } from "@/lib/format";
import { SolarSystemProgress } from "@/components/SolarSystemProgress";

/** Compact sparkline. Colors by trend unless `color` given. */
export function Sparkline({
  data,
  width = 120,
  height = 34,
  color,
  fill = true,
  strokeWidth = 1.5,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  strokeWidth?: number;
}) {
  if (data.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });
  const up = data[data.length - 1] >= data[0];
  const stroke = color ?? (up ? "#22e39b" : "#ff5470");
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const id = `spark-${Math.round(pts[0][1] * 1000)}-${data.length}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={line} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Larger area price chart with gridlines. */
export function AreaChart({
  data,
  height = 220,
  color = "#22e39b",
}: {
  data: number[];
  height?: number;
  color?: string;
}) {
  const width = 720;
  if (data.length < 2) return <svg viewBox={`0 0 ${width} ${height}`} className="w-full" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const y = (d: number) => height - ((d - min) / range) * (height - 24) - 12;
  const pts = data.map((d, i) => [i * stepX, y(d)] as const);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={width} y1={height * f} y2={height * f} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#areaFill)" className="fade-area" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        pathLength={1}
        className="draw-line"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

/**
 * Confidence gauge, rendered as a miniature solar system.
 *
 * The API is unchanged from the original SVG arc, so every existing call site
 * upgrades in place. The renderer tier is chosen from `size`: instances at list
 * scale (< 88px) use the Canvas2D tier, larger single-instance placements get
 * the full WebGL scene. See components/SolarSystemProgress for the rationale.
 */
export function ConfidenceRing({
  score,
  size = 120,
  level = "green",
  label = "CONFIDENCE",
}: {
  score: number;
  size?: number;
  level?: AlertLevel;
  label?: string;
}) {
  return <SolarSystemProgress score={score} size={size} level={level} label={label} />;
}

/** Horizontal component bar for score breakdowns. */
export function ComponentBar({
  label,
  value,
  color = "#22e39b",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-white/60">{label}</span>
        <span className="tabular font-semibold text-white/80">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className={classNames("h-full rounded-full transition-all duration-700")}
          style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color, boxShadow: `0 0 8px ${color}55` }}
        />
      </div>
    </div>
  );
}
