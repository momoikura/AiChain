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

const subscribers = new Set<TickFn>();
let rafId = 0;
let startTime = 0;
let lastTime = 0;

function frame(now: number) {
  if (!startTime) startTime = now;
  const elapsed = (now - startTime) / 1000;
  // Clamp: a backgrounded tab resuming can deliver a multi-second delta.
  const delta = Math.min((now - (lastTime || now)) / 1000, 0.05);
  lastTime = now;

  subscribers.forEach((fn) => fn(elapsed, delta));

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

export function subscribeTick(fn: TickFn): () => void {
  subscribers.add(fn);
  start();
  return () => {
    subscribers.delete(fn);
    if (!subscribers.size) stop();
  };
}
