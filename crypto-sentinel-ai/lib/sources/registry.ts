/**
 * Source registry + adapter contract.
 *
 * Every external intelligence provider implements `SourceAdapter`. The rest
 * of the platform only ever talks to this interface — so replacing a
 * simulated provider with a real, keyed API is a one-file change and never
 * touches the engine or UI.
 *
 *   class NansenAdapter implements SourceAdapter { ... real fetch ... }
 *
 * `live: false` sources below are simulated. Wiring a key flips them live.
 */

import type { DataSource, Signal, SourceCategory } from "@/lib/types";

export interface SourceAdapter {
  meta: DataSource;
  /**
   * Pull the latest signals this source can observe for a token universe.
   * Real adapters fetch + normalize; simulated adapters synthesize.
   */
  poll(symbols: string[], now: number): Signal[];
}

type Cost = DataSource["cost"];

/** The full source catalogue the platform is designed to fuse. */
export const SOURCES: DataSource[] = [
  // On-chain intelligence
  s("etherscan", "Etherscan", "on-chain", 90, "free"),
  s("solscan", "Solscan", "on-chain", 87, "free"),
  s("bscscan", "BscScan", "on-chain", 85, "free"),
  s("basescan", "BaseScan", "on-chain", 85, "free"),
  s("tronscan", "TronScan", "on-chain", 80, "free"),
  s("snowtrace", "SnowTrace", "on-chain", 82, "free"),
  s("blockchair", "Blockchair", "on-chain", 83, "freemium"),
  s("debank", "DeBank", "on-chain", 84, "freemium"),
  s("nansen", "Nansen", "on-chain", 94, "paid"),
  s("arkham", "Arkham Intelligence", "on-chain", 92, "paid"),

  // Market data
  s("coingecko", "CoinGecko", "market", 88, "free"),
  s("dexscreener", "DexScreener", "market", 84, "free"),
  s("geckoterminal", "GeckoTerminal (DEX)", "market", 83, "free"),
  s("binance", "Binance", "market", 93, "free"),
  s("bybit", "Bybit", "market", 89, "free"),
  s("okx", "OKX", "market", 89, "free"),
  s("coinbase", "Coinbase", "market", 91, "free"),
  s("kraken", "Kraken", "market", 90, "free"),
  s("hyperliquid", "Hyperliquid", "market", 85, "free"),
  s("jupiter", "Jupiter", "market", 82, "free"),
  s("uniswap", "Uniswap (subgraph)", "market", 88, "free"),
  s("pancakeswap", "PancakeSwap", "market", 80, "free"),
  s("coinmarketcap", "CoinMarketCap", "market", 86, "freemium"),
  s("birdeye", "Birdeye (Solana)", "market", 82, "freemium"),

  // Blockchain analytics
  s("santiment", "Santiment", "analytics", 84, "freemium"),
  s("intotheblock", "IntoTheBlock", "analytics", 83, "freemium"),
  s("glassnode", "Glassnode", "analytics", 90, "paid"),
  s("cryptoquant", "CryptoQuant", "analytics", 88, "paid"),
  s("tokenterminal", "Token Terminal", "analytics", 86, "paid"),

  // DeFi analytics
  s("defillama", "DeFiLlama", "defi", 89, "free"),
  s("dune", "Dune Analytics", "defi", 85, "freemium"),

  // Developer activity
  s("github", "GitHub", "developer", 87, "free"),

  // Governance
  s("snapshot", "Snapshot / DAO Governance", "governance", 82, "free"),

  // News
  s("cryptopanic", "CryptoPanic (aggregator)", "news", 78, "free"),
  s("coindesk", "CoinDesk (RSS)", "news", 84, "free"),
  s("theblock", "The Block", "news", 85, "freemium"),
  s("decrypt", "Decrypt (RSS)", "news", 80, "free"),
  s("cointelegraph", "Cointelegraph (RSS)", "news", 74, "free"),

  // Social intelligence
  s("reddit", "Reddit", "social", 58, "free"),
  s("pumpfun", "Pump.fun (meme launches)", "social", 60, "free"),
  s("telegram", "Telegram", "social", 55, "free"),
  s("discord", "Discord", "social", 57, "free"),
  s("x", "X (Twitter)", "social", 62, "freemium"),
];

function s(
  id: string,
  name: string,
  category: SourceCategory,
  reliability: number,
  cost: Cost
): DataSource {
  return {
    id,
    name,
    category,
    reliability,
    live: false, // flip to true when an API key is configured
    status: "simulated",
    latencyMs: 0,
    cost,
  };
}

export const SOURCE_BY_ID: Record<string, DataSource> = Object.fromEntries(
  SOURCES.map((x) => [x.id, x])
);

export const CATEGORY_LABEL: Record<SourceCategory, string> = {
  "on-chain": "On-Chain",
  market: "Market",
  analytics: "Analytics",
  defi: "DeFi",
  developer: "Developer",
  governance: "Governance",
  news: "News",
  social: "Social",
};
