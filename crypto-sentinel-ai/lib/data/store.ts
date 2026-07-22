/**
 * Facade the UI calls. Ties the simulated feed to the engine for a given
 * "tick" (a minute-resolution clock). Pure + deterministic, so it renders
 * identically on server and client for a given tick.
 */

import { generateTokens } from "@/lib/data/universe";
import { runEngine, type EnginePass } from "@/lib/engine/score";

/** Minute-resolution tick. Stable within a render, advances over time. */
export function currentTick(now: number = Date.now()): number {
  return Math.floor(now / 60_000);
}

type Snapshot = EnginePass & { now: number };

/**
 * Single-entry memo, keyed by tick.
 *
 * getSnapshot regenerates the whole token universe and re-runs the scoring
 * engine. It is pure and deterministic in `tick`, so the result is safe to
 * reuse — and it needs to be: several components subscribe to the feed
 * independently (dashboard, meme radar, signal list, the alert notifier), and
 * without this each one pays for its own full engine pass on every update.
 */
let memoTick: number | null = null;
let memoValue: Snapshot | null = null;

export function getSnapshot(tick: number): Snapshot {
  if (memoTick === tick && memoValue) return memoValue;

  const now = 1_752_000_000_000 + tick * 60_000;
  const raw = generateTokens(tick);
  const pass = runEngine(raw, now);

  memoTick = tick;
  memoValue = { ...pass, now };
  return memoValue;
}
