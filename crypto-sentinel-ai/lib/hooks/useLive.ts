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
/**
 * One clock for the whole app.
 *
 * Each consumer used to own a setInterval at its own rate (5s / 6s / 15s), which
 * meant N independent timers, N staggered React re-render cascades per cycle,
 * and — because each advanced its own counter — different screens drifting into
 * *different simulation states*. A single shared tick fixes the correctness
 * problem and collapses the work into one cascade.
 */
const TICK_MS = 5000;
const tickSubscribers = new Set<(t: number) => void>();
let sharedTick: number | null = null;
let tickTimer: ReturnType<typeof setInterval> | null = null;

function advance() {
  if (sharedTick === null) return;
  sharedTick += 1;
  tickSubscribers.forEach((fn) => fn(sharedTick as number));
}

function subscribeTickSource(initial: number, fn: (t: number) => void): () => void {
  if (sharedTick === null) sharedTick = initial;
  tickSubscribers.add(fn);
  // Align a late subscriber with the clock the rest of the app is already on.
  if (sharedTick !== initial) fn(sharedTick);

  if (!tickTimer) tickTimer = setInterval(advance, TICK_MS);

  return () => {
    tickSubscribers.delete(fn);
    if (tickSubscribers.size === 0 && tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  };
}

export function useLiveSnapshot(
  initialTick: number,
  /** @deprecated Retained for call-site compatibility; the clock is now shared. */
  _intervalMs = 5000
): EnginePass & { now: number; tick: number; live: boolean; realMarket: boolean } {
  const [tick, setTick] = useState(initialTick);
  const [live, setLive] = useState(false);
  const market = useLiveMarket();

  useEffect(() => {
    setLive(true);
    return subscribeTickSource(initialTick, setTick);
    // initialTick is a server-rendered constant for the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
