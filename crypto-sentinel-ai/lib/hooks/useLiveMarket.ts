"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/market/coingecko";

/**
 * Shared live-market store. A single module-level poller feeds every component
 * that needs quotes, so mounting 5 views does NOT mean 5 upstream calls.
 * Refreshes once a minute; the server route is cached for the same window.
 */
export type QuoteMap = Record<string, Quote>;

let cache: QuoteMap = {};
let lastFetch = 0;
let inFlight: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const subs = new Set<(m: QuoteMap) => void>();
const TTL = 60_000;

async function refresh(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { quotes?: Quote[] };
      const next: QuoteMap = {};
      for (const q of data.quotes ?? []) next[q.symbol] = q;
      if (Object.keys(next).length) {
        cache = next;
        lastFetch = Date.now();
        subs.forEach((cb) => cb(cache));
      }
    } catch {
      /* keep last good quotes; UI falls back to simulated values */
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export function useLiveMarket(): QuoteMap {
  const [quotes, setQuotes] = useState<QuoteMap>(cache);

  useEffect(() => {
    const cb = (m: QuoteMap) => setQuotes(m);
    subs.add(cb);

    if (Date.now() - lastFetch > TTL) void refresh();
    else setQuotes(cache);

    // One shared interval regardless of how many subscribers.
    if (!timer) timer = setInterval(() => void refresh(), TTL);

    return () => {
      subs.delete(cb);
      if (subs.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);

  return quotes;
}
