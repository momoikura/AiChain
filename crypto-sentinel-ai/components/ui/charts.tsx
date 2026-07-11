import type { AlertLevel } from "@/lib/types";
import { classNames } from "@/lib/format";

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
      <path d={area} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/** Circular confidence gauge with color by level. */
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
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = level === "red" ? "#ff5470" : level === "yellow" ? "#f5c542" : "#22e39b";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)`, transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="tabular text-2xl font-bold" style={{ color }}>
          {Math.round(score)}
        </span>
        <span className="text-[8px] font-semibold uppercase tracking-widest text-white/40">{label}</span>
      </div>
    </div>
  );
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
