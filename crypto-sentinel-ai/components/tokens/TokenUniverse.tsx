"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLiveSnapshot } from "@/lib/hooks/useLive";
import { fmtPct, fmtUsd, fmtPrice, classNames } from "@/lib/format";
import { Sparkline } from "@/components/ui/charts";
import { LevelBadge, MemeBadge } from "@/components/ui/primitives";

type Filter = "all" | "majors" | "memes";

export function TokenUniverse({ initialTick }: { initialTick: number }) {
  const { tokens } = useLiveSnapshot(initialTick, 6000);
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(
    () =>
      tokens.filter((t) =>
        filter === "all" ? true : filter === "memes" ? t.isMeme : !t.isMeme
      ),
    [tokens, filter]
  );

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: `All · ${tokens.length}` },
    { key: "majors", label: `Majors · ${tokens.filter((t) => !t.isMeme).length}` },
    { key: "memes", label: `Memes · ${tokens.filter((t) => t.isMeme).length}` },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Token Universe</h1>
        <p className="mt-1 text-sm text-white/50">
          Live sentinel scores across the tracked universe. Click a row for the full intelligence
          dossier.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={classNames(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
              filter === f.key
                ? "border-white/20 bg-white/[0.06] text-white"
                : "border-white/8 text-white/50 hover:text-white/80"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Desktop: dense table */}
      <div className="hidden glass overflow-hidden rounded-2xl lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-[11px] uppercase tracking-widest text-white/40">
                <th className="px-4 py-3 font-medium">Token</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">24h</th>
                <th className="px-4 py-3 text-right font-medium">7d</th>
                <th className="px-4 py-3 text-right font-medium">MCap</th>
                <th className="px-4 py-3 text-right font-medium">Volume</th>
                <th className="px-4 py-3 text-center font-medium">Trend</th>
                <th className="px-4 py-3 text-right font-medium">Sentinel</th>
                <th className="px-4 py-3 text-center font-medium">Signal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.symbol}
                  className="group border-b border-white/5 transition hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <Link href={`/tokens/${t.symbol}`} className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-[11px] font-bold text-white/80">
                        {t.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-white group-hover:text-signal-green">
                          {t.symbol}
                          {t.isMeme && <MemeBadge />}
                        </div>
                        <div className="text-[11px] text-white/40">{t.name}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="tabular px-4 py-3 text-right text-white/80">
                    {fmtPrice(t.price)}
                  </td>
                  <td className={classNames("tabular px-4 py-3 text-right", t.change24h >= 0 ? "text-signal-green" : "text-signal-red")}>
                    {fmtPct(t.change24h)}
                  </td>
                  <td className={classNames("tabular px-4 py-3 text-right", t.change7d >= 0 ? "text-signal-green" : "text-signal-red")}>
                    {fmtPct(t.change7d)}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-white/60">
                    {fmtUsd(t.marketCap, { compact: true })}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-white/60">
                    {fmtUsd(t.volume24h, { compact: true })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <Sparkline data={t.spark} width={80} height={26} fill={false} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={classNames(
                        "tabular text-base font-bold",
                        t.sentinelScore >= 84
                          ? "text-signal-yellow"
                          : t.topLevel === "red"
                          ? "text-signal-red"
                          : "text-signal-green"
                      )}
                    >
                      {t.sentinelScore}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <LevelBadge level={t.topLevel} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: stacked cards (no horizontal scroll) */}
      <div className="space-y-2.5 lg:hidden">
        {rows.map((t) => (
          <Link key={t.symbol} href={`/tokens/${t.symbol}`}>
            <div className="glass glass-hover rounded-2xl p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-[11px] font-bold text-white/80">
                    {t.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      {t.symbol}
                      {t.isMeme && <MemeBadge />}
                    </div>
                    <div className="text-[11px] text-white/40">{t.name}</div>
                  </div>
                </div>
                <LevelBadge level={t.topLevel} />
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="tabular text-base font-semibold text-white">{fmtPrice(t.price)}</div>
                  <div className="mt-0.5 flex gap-2 text-xs">
                    <span className={classNames("tabular", t.change24h >= 0 ? "text-signal-green" : "text-signal-red")}>
                      {fmtPct(t.change24h)} · 24h
                    </span>
                    <span className={classNames("tabular", t.change7d >= 0 ? "text-signal-green" : "text-signal-red")}>
                      {fmtPct(t.change7d)} · 7d
                    </span>
                  </div>
                </div>
                <Sparkline data={t.spark} width={92} height={30} />
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2.5 text-[11px] text-white/40">
                <span>MCap {fmtUsd(t.marketCap, { compact: true })}</span>
                <span>Vol {fmtUsd(t.volume24h, { compact: true })}</span>
                <span className="flex items-center gap-1">
                  Sentinel
                  <span
                    className={classNames(
                      "tabular font-bold",
                      t.sentinelScore >= 84 ? "text-signal-yellow" : t.topLevel === "red" ? "text-signal-red" : "text-signal-green"
                    )}
                  >
                    {t.sentinelScore}
                  </span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
