"use client";

import { useEffect, useMemo, useState } from "react";
import { getSnapshot } from "@/lib/data/store";
import { useLiveMarket } from "@/lib/hooks/useLiveMarket";
import type { EnginePass } from "@/lib/engine/score";

/**
 * Live snapshot = REAL market data (CoinGecko, refreshed every 60s) overlaid on
 * the simulated intelligence engine.
 *
 *  - price / 24h / 7d / market cap / volume / FDV / sparkline → real
 *  - signals, alerts, confidence scores → still simulated (real on-chain
 *    intelligence needs paid providers)
 *
 * `tick` advances client-side so the engine keeps evolving; if quotes haven't
 * loaded (or the upstream is rate-limited) we fall back to simulated values so
 * the UI never breaks.
 */
export function useLiveSnapshot(
  initialTick: number,
  intervalMs = 5000
): EnginePass & { now: number; tick: number; live: boolean; realMarket: boolean } {
  const [tick, setTick] = useState(initialTick);
  const [live, setLive] = useState(false);
  const market = useLiveMarket();

  useEffect(() => {
    setLive(true);
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const snap = useMemo(() => {
    const s = getSnapshot(tick);
    const haveQuotes = Object.keys(market).length > 0;
    if (!haveQuotes) return { ...s, realMarket: false };

    const tokens = s.tokens.map((t) => {
      const q = market[t.symbol];
      if (!q) return t;
      return {
        ...t,
        price: q.price,
        change24h: q.change24h,
        change7d: q.change7d,
        marketCap: q.marketCap,
        volume24h: q.volume24h,
        fdv: q.fdv || t.fdv,
        spark: q.spark.length > 2 ? q.spark : t.spark,
      };
    });
    return { ...s, tokens, realMarket: true };
  }, [tick, market]);

  return { ...snap, tick, live };
}
