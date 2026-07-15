"use client";

import { IcArrowRight, IcPulse, IcSignals, IcSources, IcThreat } from "@/components/brand/icons";
import Link from "next/link";
import { useLiveSnapshot } from "@/lib/hooks/useLive";
import { fmtCompact, timeAgo, classNames } from "@/lib/format";
import { GlassCard, SectionTitle, CategoryTag } from "@/components/ui/primitives";
import { MarketTicker } from "./MarketTicker";
import { WatchGrid } from "./WatchGrid";
import { AlertCard } from "@/components/alerts/AlertCard";
import { MemeRadar } from "@/components/memes/MemeRadar";
import { ScrambleText } from "@/components/fx/ScrambleText";
import { Reveal } from "@/components/fx/Reveal";
import { CountUp } from "@/components/fx/CountUp";
import { SectorScroll } from "@/components/fx/SectorScroll";
import { HeroGlobe } from "@/components/three/HeroGlobe";
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
  value: ReactNode;
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
      {/* Hero — 3D holographic globe behind the command banner */}
      <div className="relative">
        <div
          className="pointer-events-none absolute -right-10 -top-28 hidden h-[440px] w-[620px] md:block"
          style={{
            maskImage: "radial-gradient(ellipse at center, black 38%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 38%, transparent 72%)",
          }}
        >
          <HeroGlobe className="h-full w-full" />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.25em] text-signal-green/50">
            <span className="text-signal-green/30">operator@sentinel</span>:~/command-center$
          </div>
          <div className="flex items-center gap-2">
            <ScrambleText
              as="h1"
              text="COMMAND CENTER"
              className="phosphor text-2xl font-bold tracking-tight sm:text-3xl"
              duration={1100}
            />
            <span className="flex items-center gap-1.5 rounded-full border border-signal-green/25 bg-signal-green/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-signal-green">
              <span className={classNames("h-1.5 w-1.5 rounded-full bg-signal-green", live && "animate-pulse")} />
              {live ? "Live" : "Sync"}
            </span>
          </div>
          <p className="mt-1.5 font-mono text-sm text-signal-green/45">
            <span className="text-signal-green/70">&gt;</span> fusing {SOURCES.length} sources · on-chain · market · defi · dev · gov · news · social —{" "}
            <span className="phosphor">$0 to run</span>
          </p>
        </div>
        <Link
          href="/signals"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/80 transition hover:border-signal-green/40 hover:text-white"
        >
          Open signal feed <IcArrowRight className="h-4 w-4" />
        </Link>
        </div>
      </div>

      <MarketTicker tokens={tokens} />

      {/* Stat row */}
      <Reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<IcSignals size={17} />} label="Active Alerts" value={<CountUp value={alerts.length} />} sub={`${green} green · ${yellow} yellow · ${red} red`} tone="green" />
        <StatTile icon={<IcPulse size={17} />} label="Avg Confidence" value={<CountUp value={avgConfidence} />} sub="top-8 alert composite" tone="yellow" />
        <StatTile icon={<IcThreat size={17} />} label="Risk Alerts" value={<CountUp value={red} />} sub="sell-pressure / volatility" tone="red" />
        <StatTile icon={<IcSources size={17} />} label="Tokens Tracked" value={<CountUp value={tokens.length} />} sub="cross-validated in real time" tone="blue" />
      </Reveal>

      {/* Priority alerts + signal stream */}
      <Reveal className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
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
          <GlassCard className="max-h-[560px] overflow-y-auto p-2" data-lenis-prevent>
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
      </Reveal>

      {/* Watchlist */}
      <Reveal className="space-y-3">
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
      </Reveal>

      {/* Meme radar */}
      <Reveal>
        <MemeRadar initialTick={initialTick} limit={3} />
      </Reveal>

      {/* GSAP horizontal-pinned intelligence sectors */}
      <SectorScroll />
    </div>
  );
}
