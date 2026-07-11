"use client";

import Link from "next/link";
import { Sparkles, Flame, ShieldAlert, TrendingUp } from "lucide-react";
import { useLiveSnapshot } from "@/lib/hooks/useLive";
import { fmtPct, fmtPrice, classNames } from "@/lib/format";
import { LevelBadge, GlassCard, SectionTitle } from "@/components/ui/primitives";
import type { Signal } from "@/lib/types";

function signalChip(s: Signal) {
  const tone =
    s.polarity === "bullish"
      ? "border-signal-green/25 bg-signal-green/5 text-signal-green/90"
      : s.polarity === "bearish"
      ? "border-signal-red/25 bg-signal-red/5 text-signal-red/90"
      : "border-white/10 bg-white/[0.03] text-white/60";
  return (
    <span
      key={s.id}
      className={classNames(
        "inline-flex max-w-full items-center gap-1 truncate rounded-md border px-2 py-0.5 text-[11px]",
        tone
      )}
    >
      {s.polarity === "bearish" ? "▼" : s.polarity === "bullish" ? "▲" : "•"} {s.headline}
    </span>
  );
}

export function MemeRadar({ initialTick, limit }: { initialTick: number; limit?: number }) {
  const { tokens, signalsBySymbol, alerts } = useLiveSnapshot(initialTick, 5000);
  const memes = tokens.filter((t) => t.isMeme);
  const shown = limit ? memes.slice(0, limit) : memes;

  const hottest = memes[0];
  const riskiest = [...memes].sort((a, b) => (a.topLevel === "red" ? -1 : 1) - (b.topLevel === "red" ? -1 : 1))[0];
  const memeAlerts = alerts.filter((a) => tokens.find((t) => t.symbol === a.tokenSymbol)?.isMeme).length;

  return (
    <div className="space-y-5">
      {!limit && (
        <>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-signal-violet" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Meme Radar</h1>
            </div>
            <p className="mt-1 text-sm text-white/50">
              Meme-native detectors — social surges, KOL posts, holder spikes, smart-money aping,
              LP locks, sniper clusters &amp; supply concentration. As with every asset,{" "}
              <span className="text-white/70">no alert fires from social buzz alone</span> — on-chain
              corroboration is always required.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
                <Flame className="h-4 w-4 text-signal-yellow" /> Hottest
              </div>
              <div className="mt-1.5 text-xl font-bold text-white">{hottest?.symbol ?? "—"}</div>
              <div className="text-[11px] text-white/40">sentinel {hottest?.sentinelScore ?? 0}</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
                <TrendingUp className="h-4 w-4 text-signal-green" /> Meme Alerts
              </div>
              <div className="mt-1.5 text-xl font-bold text-white">{memeAlerts}</div>
              <div className="text-[11px] text-white/40">multi-source corroborated</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
                <ShieldAlert className="h-4 w-4 text-signal-red" /> Watch Risk
              </div>
              <div className="mt-1.5 text-xl font-bold text-white">{riskiest?.symbol ?? "—"}</div>
              <div className="text-[11px] text-white/40">concentration / sniper risk</div>
            </GlassCard>
          </div>
        </>
      )}

      {limit && (
        <SectionTitle
          title="Meme Radar"
          subtitle="Meme-native signals · corroborated on-chain"
          right={
            <Link href="/memes" className="text-xs font-medium text-signal-violet hover:underline">
              Full radar →
            </Link>
          }
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((t) => {
          const sigs = (signalsBySymbol[t.symbol] ?? []).slice(0, 4);
          return (
            <Link key={t.symbol} href={`/tokens/${t.symbol}`}>
              <GlassCard hover className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-violet/10 text-xs font-bold text-signal-violet">
                      {t.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                        {t.symbol}
                        <span className="rounded bg-signal-violet/15 px-1 text-[9px] font-bold uppercase text-signal-violet">
                          Meme
                        </span>
                      </div>
                      <div className="text-[11px] text-white/40">{t.name}</div>
                    </div>
                  </div>
                  <LevelBadge level={t.topLevel} />
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="tabular text-base font-semibold text-white">
                      {fmtPrice(t.price)}
                    </div>
                    <div className={classNames("tabular text-xs", t.change24h >= 0 ? "text-signal-green" : "text-signal-red")}>
                      {fmtPct(t.change24h)} · 24h
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Sentinel</div>
                    <div
                      className={classNames(
                        "tabular text-lg font-bold",
                        t.sentinelScore >= 82 ? "text-signal-yellow" : t.topLevel === "red" ? "text-signal-red" : "text-signal-green"
                      )}
                    >
                      {t.sentinelScore}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sigs.map((s) => signalChip(s))}
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
