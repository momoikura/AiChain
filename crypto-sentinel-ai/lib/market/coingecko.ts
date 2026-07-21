/**
 * CoinGecko live market adapter — REAL prices, keyless free tier ($0).
 *
 * One `/coins/markets` call returns price, 24h/7d change, market cap, volume
 * and a 7-day sparkline for the whole universe. Cached server-side for 60s via
 * Next's Data Cache, so however many clients poll `/api/market`, CoinGecko is
 * hit at most once a minute (well inside the free rate limit).
 *
 * NOTE: this replaces the *market* layer only. The intelligence layer
 * (signals/alerts/scores) is still simulated — real on-chain feeds need paid
 * providers.
 */

export interface Quote {
  symbol: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  fdv: number;
  spark: number[];
}

/** Our universe → CoinGecko ids (all verified to resolve). */
export const COINGECKO_IDS: Record<string, string> = {
  SOL: "solana",
  ARB: "arbitrum",
  JUP: "jupiter-exchange-solana",
  ENA: "ethena",
  TIA: "celestia",
  SEI: "sei-network",
  PYTH: "pyth-network",
  OP: "optimism",
  INJ: "injective-protocol",
  AAVE: "aave",
  LDO: "lido-dao",
  SUI: "sui",
  WIF: "dogwifcoin",
  PEPE: "pepe",
  BONK: "bonk",
  POPCAT: "popcat",
  BRETT: "based-brett",
  MEW: "cat-in-a-dogs-world",
  FLOKI: "floki",
  SHIB: "shiba-inu",
  TURBO: "turbo",
  MOG: "mog-coin",
};

const ID_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  Object.entries(COINGECKO_IDS).map(([sym, id]) => [id, sym])
);

const ENDPOINT =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" +
  Object.values(COINGECKO_IDS).join(",") +
  "&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d";

interface CgCoin {
  id: string;
  current_price: number | null;
  market_cap: number | null;
  total_volume: number | null;
  fully_diluted_valuation?: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  sparkline_in_7d?: { price?: number[] | null } | null;
}

/** Last good payload, so a rate-limit/outage degrades gracefully. */
let lastGood: { at: number; quotes: Quote[] } | null = null;

export async function fetchQuotes(): Promise<{ quotes: Quote[]; stale: boolean }> {
  try {
    const res = await fetch(ENDPOINT, {
      // Server-side cache: at most one upstream call per minute.
      next: { revalidate: 60 },
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`coingecko ${res.status}`);
    const raw = (await res.json()) as CgCoin[];

    const quotes: Quote[] = raw
      .map((c) => {
        const symbol = ID_TO_SYMBOL[c.id];
        if (!symbol || c.current_price == null) return null;
        const spark = c.sparkline_in_7d?.price ?? [];
        return {
          symbol,
          price: c.current_price,
          change24h: c.price_change_percentage_24h_in_currency ?? 0,
          change7d: c.price_change_percentage_7d_in_currency ?? 0,
          marketCap: c.market_cap ?? 0,
          volume24h: c.total_volume ?? 0,
          fdv: c.fully_diluted_valuation ?? c.market_cap ?? 0,
          // Downsample the 7d sparkline (~168 pts) to 48 for the charts.
          spark: downsample(spark, 48),
        } as Quote;
      })
      .filter((q): q is Quote => q !== null);

    if (quotes.length) lastGood = { at: Date.now(), quotes };
    return { quotes, stale: false };
  } catch {
    // Never break the UI — serve the last good snapshot if we have one.
    return { quotes: lastGood?.quotes ?? [], stale: true };
  }
}

function downsample(arr: number[], n: number): number[] {
  if (arr.length <= n) return arr;
  const step = arr.length / n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
  out[out.length - 1] = arr[arr.length - 1]; // keep the latest point exact
  return out;
}
