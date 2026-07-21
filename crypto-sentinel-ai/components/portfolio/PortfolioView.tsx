"use client";

import { useMemo } from "react";
import Link from "next/link";
import { IcCheck, IcClose, IcMinus, IcVault, IcArrowRight } from "@/components/brand/icons";

import { getPortfolio } from "@/lib/data/portfolio";
import { fmtPct, fmtUsd, fmtNum, timeAgo, classNames } from "@/lib/format";
import { AreaChart, Sparkline } from "@/components/ui/charts";
import { GlassCard, SectionTitle, Chip } from "@/components/ui/primitives";
import type { TradeRecord } from "@/lib/types";

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <GlassCard className="p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{label}</div>
      <div className={classNames("mt-1.5 tabular text-2xl font-bold", tone ?? "text-white")}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-white/40">{sub}</div>}
    </GlassCard>
  );
}

const STATUS_META: Record<TradeRecord["status"], { icon: React.ReactNode; tone: string; label: string }> = {
  executed: { icon: <IcCheck className="h-3.5 w-3.5" />, tone: "text-signal-green", label: "Executed" },
  rejected: { icon: <IcClose className="h-3.5 w-3.5" />, tone: "text-signal-red", label: "Rejected" },
  missed: { icon: <IcMinus className="h-3.5 w-3.5" />, tone: "text-signal-yellow", label: "Missed" },
};

export function PortfolioView({ tick, connected }: { tick: number; connected: boolean }) {
  const { stats, positions, trades } = useMemo(() => getPortfolio(tick), [tick]);
  const now = 1_752_000_000_000 + tick * 60_000;

  const header = (
    <div>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.25em] text-signal-green/50">
        <span className="text-signal-green/30">operator@sentinel</span>:~/portfolio$
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-white">Portfolio Intelligence</h1>
      <p className="mt-1 text-sm text-white/50">
        Paper-trading account · performance, AI attribution, and the full decision log
        (executed, rejected &amp; missed).
      </p>
    </div>
  );

  // No exchange linked → show a true zero state rather than inventing holdings.
  if (!connected) {
    return (
      <div className="space-y-6">
        {header}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Portfolio Value" value="$0.00" sub="no exchange linked" />
          <Stat label="Total PnL" value="$0.00" sub="—" />
          <Stat label="Win Rate" value="—" sub="no trades yet" />
          <Stat label="AI Win Rate" value="—" sub="no trades yet" />
        </div>

        <GlassCard className="hud p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-signal-green/25 bg-signal-green/5 text-signal-green shadow-glow">
            <IcVault size={30} />
          </div>
          <h2 className="phosphor mt-4 text-lg font-bold uppercase tracking-widest">
            No exchange linked
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-white/50">
            Your portfolio is empty because no exchange is connected yet. Link a read-only API
            key and Sentinel will sync balances, PnL and your full decision log here.
          </p>
          <Link
            href="/settings"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-signal-green to-accent-cyan px-5 py-2.5 text-sm font-semibold text-base-950 shadow-glow transition hover:brightness-110"
          >
            Connect an exchange <IcArrowRight size={16} />
          </Link>
          <p className="mt-4 font-mono text-[11px] text-white/25">
            keys are encrypted (AES-256-GCM) before storage · read-only recommended
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Portfolio Value" value={fmtUsd(stats.totalValue, { compact: true })} sub="incl. stables" />
        <Stat label="Total PnL" value={`${stats.totalPnl >= 0 ? "+" : ""}${fmtUsd(stats.totalPnl, { compact: true })}`} sub={fmtPct(stats.totalPnlPct)} tone={stats.totalPnl >= 0 ? "text-signal-green" : "text-signal-red"} />
        <Stat label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} sub="all strategies" tone="text-signal-green" />
        <Stat label="AI Win Rate" value={`${stats.aiWinRate.toFixed(1)}%`} sub="engine-attributed trades" tone="text-signal-blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <GlassCard className="p-5">
          <SectionTitle
            title="Equity Curve"
            subtitle="60-period paper equity"
            right={
              <div className="flex gap-4 text-right">
                <div>
                  <div className="text-[10px] uppercase text-white/40">Sharpe</div>
                  <div className="tabular text-sm font-semibold text-white/90">{stats.sharpe.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-white/40">Max DD</div>
                  <div className="tabular text-sm font-semibold text-signal-red">{stats.maxDrawdown.toFixed(1)}%</div>
                </div>
              </div>
            }
          />
          <div className="mt-4">
            <AreaChart data={stats.equityCurve} color="#22e39b" height={220} />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Allocation" subtitle="By position value" />
          <div className="mt-4 space-y-3">
            {positions.map((p) => (
              <div key={p.symbol}>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-white/85">{p.symbol}</span>
                    <span className="text-white/40">{p.name}</span>
                  </span>
                  <span className="tabular text-white/60">{p.allocationPct.toFixed(1)}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-signal-green to-accent-cyan"
                    style={{ width: `${p.allocationPct}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-white/40">
                  <span>{fmtNum(p.qty, 0)} @ {fmtUsd(p.avgEntry, { dp: p.avgEntry < 1 ? 4 : 2 })}</span>
                  <span className={classNames("tabular", p.unrealizedPnl >= 0 ? "text-signal-green" : "text-signal-red")}>
                    {p.unrealizedPnl >= 0 ? "+" : ""}{fmtUsd(p.unrealizedPnl, { compact: true })} ({fmtPct(p.unrealizedPnlPct)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Decision log */}
      <div className="space-y-3">
        <SectionTitle title="AI Decision Log" subtitle="Executed, rejected & missed — with the reasoning behind each" />
        <GlassCard className="hidden overflow-hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-[11px] uppercase tracking-widest text-white/40">
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Token</th>
                  <th className="px-4 py-3 font-medium">Side</th>
                  <th className="px-4 py-3 font-medium">Rule</th>
                  <th className="px-4 py-3 font-medium">Reasoning</th>
                  <th className="px-4 py-3 text-right font-medium">PnL</th>
                  <th className="px-4 py-3 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => {
                  const meta = STATUS_META[t.status];
                  return (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <span className={classNames("inline-flex items-center gap-1.5 text-xs font-medium", meta.tone)}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-white/85">{t.symbol}</td>
                      <td className="px-4 py-3">
                        <Chip tone={t.side === "buy" ? "green" : "red"}>{t.side.toUpperCase()}</Chip>
                      </td>
                      <td className="px-4 py-3 text-white/60">{t.ruleName}</td>
                      <td className="max-w-sm px-4 py-3 text-[12px] text-white/50">{t.reason}</td>
                      <td className={classNames("tabular px-4 py-3 text-right", t.pnl == null ? "text-white/30" : t.pnl >= 0 ? "text-signal-green" : "text-signal-red")}>
                        {t.pnl == null ? "—" : `${t.pnl >= 0 ? "+" : ""}${fmtUsd(t.pnl, { compact: true })}`}
                      </td>
                      <td className="px-4 py-3 text-right text-[11px] text-white/40">{timeAgo(t.timestamp, now)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Mobile: stacked decision cards (no horizontal scroll) */}
        <div className="space-y-2.5 lg:hidden">
          {trades.map((t) => {
            const meta = STATUS_META[t.status];
            return (
              <div key={t.id} className="glass rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className={classNames("inline-flex items-center gap-1.5 text-xs font-semibold", meta.tone)}>
                    {meta.icon} {meta.label}
                  </span>
                  <span className="font-mono text-[11px] text-white/40">{timeAgo(t.timestamp, now)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-semibold text-white/85">{t.symbol}</span>
                  <Chip tone={t.side === "buy" ? "green" : "red"}>{t.side.toUpperCase()}</Chip>
                  <span
                    className={classNames(
                      "tabular ml-auto text-sm font-semibold",
                      t.pnl == null ? "text-white/30" : t.pnl >= 0 ? "text-signal-green" : "text-signal-red"
                    )}
                  >
                    {t.pnl == null ? "—" : `${t.pnl >= 0 ? "+" : ""}${fmtUsd(t.pnl, { compact: true })}`}
                  </span>
                </div>
                <div className="mt-1.5 text-[12px] font-medium text-white/60">{t.ruleName}</div>
                <div className="mt-0.5 text-[12px] leading-snug text-white/45">{t.reason}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
