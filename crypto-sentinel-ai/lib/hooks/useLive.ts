"use client";

import { useEffect, useMemo, useState } from "react";
import { getSnapshot } from "@/lib/data/store";
import type { EnginePass } from "@/lib/engine/score";

/**
 * Advances the simulated clock client-side to give the terminal a live feel.
 * Starts from `initialTick` (rendered on the server → no hydration mismatch),
 * then steps forward every `intervalMs`.
 *
 * In production, replace this with a WebSocket/SSE subscription that pushes
 * fresh engine passes; the component contract stays identical.
 */
export function useLiveSnapshot(
  initialTick: number,
  intervalMs = 5000
): EnginePass & { now: number; tick: number; live: boolean } {
  const [tick, setTick] = useState(initialTick);
  const [live, setLive] = useState(false);

  useEffect(() => {
    setLive(true);
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const snap = useMemo(() => getSnapshot(tick), [tick]);
  return { ...snap, tick, live };
}
