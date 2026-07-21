import { binance } from "./binance";
import { bybit } from "./bybit";
import type { ExchangeAdapter } from "./types";

/**
 * Registry of read-only balance adapters. Add OKX / Coinbase Advanced here —
 * they only need to satisfy the same `ExchangeAdapter` interface.
 */
export const ADAPTERS: ExchangeAdapter[] = [binance, bybit];

/** Match a stored exchange label ("Binance", "Coinbase Advanced") to an adapter. */
export function getAdapter(exchangeLabel: string): ExchangeAdapter | null {
  const key = exchangeLabel.trim().toLowerCase();
  return ADAPTERS.find((a) => key.startsWith(a.id)) ?? null;
}

export const SUPPORTED_EXCHANGES = ADAPTERS.map((a) => a.label);
export type { Balance, ExchangeAdapter, ExchangeCredentials } from "./types";
