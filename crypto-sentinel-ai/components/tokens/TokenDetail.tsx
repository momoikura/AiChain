"use client";

import Link from "next/link";
import { IcArrowLeft, IcLiquidity, IcPercent, IcPulse, IcSources, IcTrend } from "@/components/brand/icons";

import { useLiveSnapshot } from "@/lib/hooks/useLive";
import { fmtPct, fmtUsd, fmtPrice, fmtNum, timeAgo, classNames } from "@/lib/format";
import { AreaChart, ConfidenceRing, ComponentBar } from "@/components/ui/charts";
import { GlassCard, SectionTitle, LevelBadge, CategoryTag, Chip, MemeBadge } from "@/components/ui/primitives";
import { WalletGraph } from "./WalletGraph";
import { AlertCard } from "@/components/alerts/AlertCard";

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
      <span className="text-white/40">{icon}</span>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
        <div className="tabular text-sm font-semibold text-white/90">{value}</div>
      </div>
    </div>
  );
}

export function TokenDetail({ symbol, initialTick }: { symbol: string; initialTick: number }) {
  const { tokens, alerts, signalsBySymbol, now } = useLiveSnapshot(initialTick, 6000);
  const token = tokens.find((t) => t.symbol === symbol);
  const tokenAlerts = alerts.filter((a) => a.tokenSymbol === symbol);
  const signals = (signalsBySymbol[symbol] ?? []).slice(0, 18);

  if (!token) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <p className="text-white/60">Token “{symbol}” is not in the tracked universe.</p>
        <Link href="/tokens" className="mt-3 inline-block text-sm text-signal-green hover:underline">
          ← Back to universe
        </Link>
      </div>
    );
  }

  const primary = tokenAlerts[0];
  const color = token.change24h >= 0 ? "#22e39b" : "#ff5470";

  return (
    <div className="space-y-6">
      <Link href="/tokens" className="inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white">
        <IcArrowLeft className="h-4 w-4" /> Token Universe
      </Link>

      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] text-lg font-bold text-white">
              {token.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{token.name}</h1>
                <span className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white/50">
                  {token.symbol} · {token.chain}
                </span>
                {token.isMeme && <MemeBadge />}
                <LevelBadge level={token.topLevel} />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="tabular text-2xl font-bold text-white">
                  {fmtPrice(token.price)}
                </span>
                <span className={classNames("tabular text-sm", token.change24h >= 0 ? "text-signal-green" : "text-signal-red")}>
                  {fmtPct(token.change24h)} (24h)
                </span>
                <span className={classNames("tabular text-sm", token.change7d >= 0 ? "text-signal-green" : "text-signal-red")}>
                  {fmtPct(token.change7d)} (7d)
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConfidenceRing score={token.sentinelScore} level={token.topLevel} size={92} label="SENTINEL" />
          </div>
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <Metric icon={<IcSources className="h-4 w-4" />} label="Market Cap" value={fmtUsd(token.marketCap, { compact: true })} />
          <Metric icon={<IcSources className="h-4 w-4" />} label="FDV" value={fmtUsd(token.fdv, { compact: true })} />
          <Metric icon={<IcPulse className="h-4 w-4" />} label="Volume 24h" value={fmtUsd(token.volume24h, { compact: true })} />
          <Metric icon={<IcLiquidity className="h-4 w-4" />} label="Liquidity" value={fmtUsd(token.liquidity, { compact: true })} />
          <Metric icon={<IcPercent className="h-4 w-4" />} label="Funding" value={`${(token.fundingRate * 100).toFixed(3)}%`} />
          <Metric icon={<IcTrend className="h-4 w-4" />} label="Open Interest" value={fmtUsd(token.openInterest, { compact: true })} />
        </div>
      </div>

      {/* Chart + Score breakdown */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <GlassCard className="p-5">
          <SectionTitle title="Price · 48h" subtitle="Simulated feed — swap for live market adapter" />
          <div className="mt-4">
            <AreaChart data={token.spark} color={color} height={240} />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Confidence Composition" subtitle={primary ? `${primary.thesis} thesis` : "no active thesis"} />
          {primary ? (
            <div className="mt-4 space-y-2.5">
              <ComponentBar label="Corroboration (independent sources)" value={primary.score.components.corroboration} />
              <ComponentBar label="On-chain confirmation" value={primary.score.components.onChainConfirmation} color="#4d9dff" />
              <ComponentBar label="Source reliability" value={primary.score.components.sourceReliability} color="#9b7bff" />
              <ComponentBar label="Statistical anomaly" value={primary.score.components.anomaly} color="#f5c542" />
              <ComponentBar label="Evidence freshness" value={primary.score.components.freshness} color="#38e8e0" />
              <ComponentBar label="Historical accuracy" value={primary.score.components.historicalAccuracy} color="#22e39b" />
              <p className="pt-2 text-[11px] leading-relaxed text-white/40">
                {primary.score.independentCategories} independent source categories corroborate this
                thesis. No single source can trigger an alert.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/40">No thesis currently clears the confidence bar.</p>
          )}
        </GlassCard>
      </div>

      {/* Wallet graph + on-chain */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <GlassCard className="p-5">
          <SectionTitle title="Wallet Relationship Graph" subtitle="On-chain clustering · net flows to token" />
          <div className="mt-3">
            <WalletGraph symbol={token.symbol} />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Raw Signal Log" subtitle="Every observation feeding the engine" />
          <div className="mt-3 max-h-[320px] space-y-1.5 overflow-y-auto pr-1" data-lenis-prevent>
            {signals.map((s) => (
              <div key={s.id} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={classNames(
                        "h-1.5 w-1.5 rounded-full",
                        s.polarity === "bullish" && "bg-signal-green",
                        s.polarity === "bearish" && "bg-signal-red",
                        s.polarity === "neutral" && "bg-white/40"
                      )}
                    />
                    <span className="text-xs font-medium text-white/80">{s.headline}</span>
                    <CategoryTag category={s.category} />
                  </div>
                  <span className="text-[10px] text-white/30">{timeAgo(s.timestamp, now)}</span>
                </div>
                <p className="mt-1 pl-3.5 text-[11px] text-white/50">{s.detail}</p>
                <div className="mt-1 flex items-center gap-2 pl-3.5 text-[10px] text-white/30">
                  <span>{s.sourceName}</span>
                  <span>· reliability {s.reliability}</span>
                  <span>· z {s.anomalyZ.toFixed(1)}</span>
                  {s.onChainConfirmed && <span className="text-signal-green/70">· on-chain ✓</span>}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        <SectionTitle title="Active Theses" subtitle="Full explainable breakdown per alert" />
        {tokenAlerts.length ? (
          tokenAlerts.map((a) => (
            <AlertCard key={`${a.tokenSymbol}-${a.thesis === "distribution" ? "short" : "long"}`} alert={a} now={now} />
          ))
        ) : (
          <GlassCard className="p-8 text-center text-sm text-white/40">
            No alert currently clears the multi-source confidence threshold for {token.symbol}.
          </GlassCard>
        )}
      </div>
    </div>
  );
}
