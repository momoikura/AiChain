import { getExchangeCredentials } from "@/lib/server/db/keys";
import { getAdapter } from "@/lib/exchanges";
import { fetchQuotes } from "@/lib/market/coingecko";
import type { Balance } from "@/lib/exchanges/types";

/**
 * Builds a REAL portfolio: signed read-only balance calls to each connected
 * exchange, aggregated across venues and valued with live CoinGecko prices.
 *
 * Assets we can't price (not in the tracked universe / not a stablecoin) are
 * still listed with their quantity but contribute 0 to the total, so the value
 * shown is never inflated by a guess.
 */

const STABLES = new Set(["USDT", "USDC", "BUSD", "DAI", "TUSD", "FDUSD", "USD"]);

export interface LivePosition {
  asset: string;
  qty: number;
  price: number | null; // null = unpriced
  valueUsd: number;
  venues: string[];
}

export interface LivePortfolio {
  connected: string[];
  positions: LivePosition[];
  totalValueUsd: number;
  pricedCoverage: number; // 0–1: share of positions we could price
  errors: { exchange: string; message: string }[];
}

export async function fetchLivePortfolio(): Promise<LivePortfolio> {
  const creds = await getExchangeCredentials();
  const errors: LivePortfolio["errors"] = [];
  const connected: string[] = [];

  // 1. Pull balances from every connected venue (in parallel, failures isolated).
  const perVenue = await Promise.all(
    creds.map(async (c) => {
      const adapter = getAdapter(c.exchange);
      if (!adapter) {
        errors.push({ exchange: c.exchange, message: "no balance adapter yet" });
        return { exchange: c.exchange, balances: [] as Balance[] };
      }
      try {
        const balances = await adapter.fetchBalances({
          apiKey: c.apiKey,
          apiSecret: c.apiSecret,
        });
        connected.push(adapter.label);
        return { exchange: adapter.label, balances };
      } catch (e) {
        errors.push({
          exchange: c.exchange,
          message: e instanceof Error ? e.message : "failed to fetch balances",
        });
        return { exchange: c.exchange, balances: [] as Balance[] };
      }
    })
  );

  // 2. Aggregate the same asset across venues.
  const agg = new Map<string, { qty: number; venues: Set<string> }>();
  for (const v of perVenue) {
    for (const b of v.balances) {
      const cur = agg.get(b.asset) ?? { qty: 0, venues: new Set<string>() };
      cur.qty += b.total;
      cur.venues.add(v.exchange);
      agg.set(b.asset, cur);
    }
  }

  // 3. Value with live prices (stablecoins pinned at $1).
  const { quotes } = await fetchQuotes();
  const priceBySymbol = new Map(quotes.map((q) => [q.symbol, q.price]));

  const positions: LivePosition[] = [];
  for (const [asset, { qty, venues }] of agg) {
    const price = STABLES.has(asset) ? 1 : priceBySymbol.get(asset) ?? null;
    positions.push({
      asset,
      qty,
      price,
      valueUsd: price != null ? qty * price : 0,
      venues: [...venues],
    });
  }
  positions.sort((a, b) => b.valueUsd - a.valueUsd || b.qty - a.qty);

  const totalValueUsd = positions.reduce((s, p) => s + p.valueUsd, 0);
  const pricedCoverage = positions.length
    ? positions.filter((p) => p.price != null).length / positions.length
    : 1;

  return { connected, positions, totalValueUsd, pricedCoverage, errors };
}
