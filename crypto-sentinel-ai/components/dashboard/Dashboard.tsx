"use client";

import {
  Radar,
  TrendingUp,
  AlertTriangle,
  Layers,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useLiveSnapshot } from "@/lib/hooks/useLive";
import { fmtCompact, timeAgo, classNames } from "@/lib/format";
import { GlassCard, SectionTitle, CategoryTag } from "@/components/ui/primitives";
import { MarketTicker } from "./MarketTicker";
import { WatchGrid } from "./WatchGrid";
import { AlertCard } from "@/components/alerts/AlertCard";
import { MemeRadar } from "@/components/memes/MemeRadar";
import { SOURCES } from "@/lib/sources/registry";
import type { ReactNode } from "react";

function StatTile({
  icon,
  label,
  value,
  sub,
  tone = "green",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "green" | "red" | "yellow" | "blue";
}) {
  const tones = {
    green: "text-signal-green",
    red: "text-signal-red",
    yellow: "text-signal-yellow",
    blue: "text-signal-blue",
  };
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
          {label}
        </span>
        <span className={tones[tone]}>{icon}</span>
      </div>
      <div className="mt-2 tabular text-2xl font-bold text-white">{value}</div>
      <div className="mt-0.5 text-[11px] text-white/40">{sub}</div>
    </GlassCard>
  );
}

export function Dashboard({ initialTick }: { initialTick: number }) {
  const { tokens, alerts, now, live } = useLiveSnapshot(initialTick);

  const red = alerts.filter((a) => a.level === "red").length;
  const yellow = alerts.filter((a) => a.level === "yellow").length;
  const green = alerts.filter((a) => a.level === "green").length;
  const topAlerts = alerts.slice(0, 4);
  const stream = alerts.flatMap((a) => a.signals.map((s) => ({ ...s, level: a.level }))).sort((a, b) => b.timestamp - a.timestamp).slice(0, 14);

  const avgConfidence = Math.round(
    alerts.slice(0, 8).reduce((s, a) => s + a.score.score, 0) / Math.max(1, Math.min(8, alerts.length))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Command Center</h1>
            <span className="flex items-center gap-1.5 rounded-full border border-signal-green/25 bg-signal-green/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-signal-green">
              <span className={classNames("h-1.5 w-1.5 rounded-full bg-signal-green", live && "animate-pulse")} />
              {live ? "Live" : "Sync"}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/50">
            Fusing {SOURCES.length} sources across on-chain, market, DeFi, developer, governance,
            news &amp; social — <span className="text-signal-green">$0 to run</span>.
          </p>
        </div>
        <Link
          href="/signals"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/80 transition hover:border-signal-green/40 hover:text-white"
        >
          Open signal feed <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <MarketTicker tokens={tokens} />

      {/* Stat row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Radar className="h-4 w-4" />} label="Active Alerts" value={String(alerts.length)} sub={`${green} green · ${yellow} yellow · ${red} red`} tone="green" />
        <StatTile icon={<Zap className="h-4 w-4" />} label="Avg Confidence" value={`${avgConfidence}`} sub="top-8 alert composite" tone="yellow" />
        <StatTile icon={<AlertTriangle className="h-4 w-4" />} label="Risk Alerts" value={String(red)} sub="sell-pressure / volatility" tone="red" />
        <StatTile icon={<Layers className="h-4 w-4" />} label="Tokens Tracked" value={String(tokens.length)} sub="cross-validated in real time" tone="blue" />
      </div>

      {/* Priority alerts + signal stream */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          <SectionTitle
            title="Priority Alerts"
            subtitle="Ranked by confidence · every alert requires multi-source corroboration"
            right={
              <Link href="/signals" className="text-xs font-medium text-signal-green hover:underline">
                View all →
              </Link>
            }
          />
          <div className="space-y-3">
            {topAlerts.map((a) => (
              <AlertCard key={`${a.tokenSymbol}-${a.thesis === "distribution" ? "short" : "long"}`} alert={a} now={now} />
            ))}
          </div>
        </div>

        {/* Live signal stream */}
        <div className="space-y-3">
          <SectionTitle title="Live Signal Stream" subtitle="Raw evidence entering the engine" />
          <GlassCard className="max-h-[560px] overflow-y-auto p-2">
            <div className="space-y-1">
              {stream.map((s) => (
                <div
                  key={s.id}
                  className="animate-fadeUp rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 transition hover:border-white/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={classNames(
                          "h-1.5 w-1.5 rounded-full",
                          s.polarity === "bullish" && "bg-signal-green",
                          s.polarity === "bearish" && "bg-signal-red",
                          s.polarity === "neutral" && "bg-white/40"
                        )}
                      />
                      <span className="text-xs font-semibold text-white/85">{s.tokenSymbol}</span>
                      <CategoryTag category={s.category} />
                    </div>
                    <span className="text-[10px] text-white/30">{timeAgo(s.timestamp, now)}</span>
                  </div>
                  <p className="mt-1 pl-3.5 text-[12px] leading-snug text-white/60">{s.detail}</p>
                  <div className="mt-1 flex items-center gap-2 pl-3.5 text-[10px] text-white/30">
                    <span>{s.sourceName}</span>
                    <span>·</span>
                    <span>z {s.anomalyZ.toFixed(1)}</span>
                    {s.onChainConfirmed && (
                      <span className="text-signal-green/70">· on-chain ✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Watchlist */}
      <div className="space-y-3">
        <SectionTitle
          title="Token Universe"
          subtitle="Highest sentinel scores first"
          right={
            <Link href="/tokens" className="text-xs font-medium text-signal-green hover:underline">
              All tokens →
            </Link>
          }
        />
        <WatchGrid tokens={tokens} />
      </div>

      {/* Meme radar */}
      <MemeRadar initialTick={initialTick} limit={3} />
    </div>
  );
}
