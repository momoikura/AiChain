"use client";

/**
 * One requestAnimationFrame loop for every lite instance on the page.
 *
 * With this component appearing dozens of times in an alert list, per-instance
 * rAF loops would mean dozens of independent callbacks competing each frame.
 * A single shared ticker fans out to all subscribers in one callback, and stops
 * completely when nothing is subscribed or the tab is hidden.
 */

type TickFn = (elapsedSeconds: number, deltaSeconds: number) => void;

interface Entry {
  fn: TickFn;
  /** Minimum seconds between invocations. 0 = every frame. */
  minDelta: number;
  last: number;
}

const subscribers = new Set<Entry>();
let rafId = 0;
let startTime = 0;
let lastTime = 0;

function frame(now: number) {
  if (!startTime) startTime = now;
  const elapsed = (now - startTime) / 1000;
  // Clamp: a backgrounded tab resuming can deliver a multi-second delta.
  const delta = Math.min((now - (lastTime || now)) / 1000, 0.05);
  lastTime = now;

  subscribers.forEach((entry) => {
    // Per-subscriber frame-rate cap. Ambient motion (drifting dust, twinkle,
    // a slowly rotating planet) is indistinguishable at 30fps, and halving the
    // canvas work matters a great deal when dozens of instances share a page.
    const since = elapsed - entry.last;
    if (since < entry.minDelta) return;
    entry.last = elapsed;
    entry.fn(elapsed, Math.min(since || delta, 0.05));
  });

  rafId = subscribers.size ? requestAnimationFrame(frame) : 0;
}

function start() {
  if (rafId || !subscribers.size) return;
  if (typeof document !== "undefined" && document.hidden) return;
  lastTime = 0;
  rafId = requestAnimationFrame(frame);
}

function stop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
}

export function subscribeTick(fn: TickFn, fps = 0): () => void {
  const entry: Entry = { fn, minDelta: fps > 0 ? 1 / fps : 0, last: -Infinity };
  subscribers.add(entry);
  start();
  return () => {
    subscribers.delete(entry);
    if (!subscribers.size) stop();
  };
}
