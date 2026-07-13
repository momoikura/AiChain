import type { ReactNode, HTMLAttributes } from "react";
import { classNames } from "@/lib/format";
import type { AlertLevel, SourceCategory } from "@/lib/types";

export function GlassCard({
  children,
  className,
  hover = false,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={classNames(
        "glass rounded-2xl",
        hover && "glass-hover cursor-pointer",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/70">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-xs text-white/40">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

const LEVEL_STYLES: Record<AlertLevel, string> = {
  green: "bg-signal-green/10 text-signal-green border-signal-green/30",
  yellow: "bg-signal-yellow/10 text-signal-yellow border-signal-yellow/30",
  red: "bg-signal-red/10 text-signal-red border-signal-red/30",
};

export function LevelBadge({ level, label }: { level: AlertLevel; label?: string }) {
  const text = label ?? level.toUpperCase();
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        LEVEL_STYLES[level]
      )}
    >
      <span
        className={classNames(
          "h-1.5 w-1.5 rounded-full",
          level === "green" && "bg-signal-green",
          level === "yellow" && "bg-signal-yellow",
          level === "red" && "bg-signal-red"
        )}
      />
      {text}
    </span>
  );
}

const CATEGORY_STYLES: Record<SourceCategory, string> = {
  "on-chain": "bg-signal-green/10 text-signal-green",
  market: "bg-signal-blue/10 text-signal-blue",
  analytics: "bg-signal-violet/10 text-signal-violet",
  defi: "bg-accent-cyan/10 text-accent-cyan",
  developer: "bg-signal-yellow/10 text-signal-yellow",
  governance: "bg-signal-blue/10 text-signal-blue",
  news: "bg-white/10 text-white/70",
  social: "bg-signal-violet/10 text-signal-violet",
};

export function CategoryTag({ category }: { category: SourceCategory }) {
  const labels: Record<SourceCategory, string> = {
    "on-chain": "On-Chain",
    market: "Market",
    analytics: "Analytics",
    defi: "DeFi",
    developer: "Dev",
    governance: "Gov",
    news: "News",
    social: "Social",
  };
  return (
    <span
      className={classNames(
        "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
        CATEGORY_STYLES[category]
      )}
    >
      {labels[category]}
    </span>
  );
}

export function MemeBadge({ className }: { className?: string }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        "bg-signal-violet/15 text-signal-violet",
        className
      )}
    >
      ★ Meme
    </span>
  );
}

export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "red" | "yellow" | "blue";
}) {
  const tones = {
    neutral: "bg-white/5 text-white/60 border-white/10",
    green: "bg-signal-green/10 text-signal-green border-signal-green/25",
    red: "bg-signal-red/10 text-signal-red border-signal-red/25",
    yellow: "bg-signal-yellow/10 text-signal-yellow border-signal-yellow/25",
    blue: "bg-signal-blue/10 text-signal-blue border-signal-blue/25",
  };
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
