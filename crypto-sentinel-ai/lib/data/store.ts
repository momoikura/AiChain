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

export function getSnapshot(tick: number): EnginePass & { now: number } {
  const now = 1_752_000_000_000 + tick * 60_000;
  const raw = generateTokens(tick);
  const pass = runEngine(raw, now);
  return { ...pass, now };
}
