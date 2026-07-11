import Link from "next/link";
import type { Token } from "@/lib/types";
import { fmtPct, fmtUsd, fmtPrice, classNames } from "@/lib/format";
import { Sparkline } from "@/components/ui/charts";
import { LevelBadge, MemeBadge } from "@/components/ui/primitives";

const CHAIN_LABEL: Record<string, string> = {
  ethereum: "ETH",
  solana: "SOL",
  bsc: "BSC",
  base: "BASE",
  arbitrum: "ARB",
  tron: "TRX",
  avalanche: "AVAX",
};

export function WatchGrid({ tokens }: { tokens: Token[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tokens.slice(0, 6).map((t) => (
        <Link key={t.symbol} href={`/tokens/${t.symbol}`}>
          <div className="glass glass-hover rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-white/80">
                  {t.symbol.slice(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    {t.symbol}
                    <span className="rounded bg-white/8 px-1 text-[9px] font-medium text-white/40">
                      {CHAIN_LABEL[t.chain] ?? t.chain}
                    </span>
                    {t.isMeme && <MemeBadge />}
                  </div>
                  <div className="text-[11px] text-white/40">{t.name}</div>
                </div>
              </div>
              <LevelBadge level={t.topLevel} />
            </div>

            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="tabular text-lg font-semibold text-white">
                  {fmtPrice(t.price)}
                </div>
                <div
                  className={classNames(
                    "tabular text-xs",
                    t.change24h >= 0 ? "text-signal-green" : "text-signal-red"
                  )}
                >
                  {fmtPct(t.change24h)} · 24h
                </div>
              </div>
              <Sparkline data={t.spark} width={110} height={38} />
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2.5 text-[11px] text-white/40">
              <span>MCap {fmtUsd(t.marketCap, { compact: true })}</span>
              <span>Vol {fmtUsd(t.volume24h, { compact: true })}</span>
              <span className="flex items-center gap-1">
                Sentinel
                <span
                  className={classNames(
                    "tabular font-bold",
                    t.sentinelScore >= 84
                      ? "text-signal-yellow"
                      : t.topLevel === "red"
                      ? "text-signal-red"
                      : "text-signal-green"
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
  );
}
