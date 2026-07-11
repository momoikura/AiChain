import type { Token } from "@/lib/types";
import { fmtPct, fmtPrice, classNames } from "@/lib/format";

export function MarketTicker({ tokens }: { tokens: Token[] }) {
  const row = [...tokens, ...tokens]; // duplicated for seamless loop
  return (
    <div className="glass overflow-hidden rounded-xl">
      <div className="flex animate-ticker whitespace-nowrap py-2.5">
        {row.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-4 text-sm">
            <span className="font-semibold text-white/80">{t.symbol}</span>
            <span className="tabular text-white/50">{fmtPrice(t.price)}</span>
            <span
              className={classNames(
                "tabular text-xs",
                t.change24h >= 0 ? "text-signal-green" : "text-signal-red"
              )}
            >
              {fmtPct(t.change24h)}
            </span>
            <span className="text-white/15">|</span>
          </div>
        ))}
      </div>
    </div>
  );
}
