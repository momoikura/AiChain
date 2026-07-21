"use client";

import { useEffect, useRef } from "react";
import { useLiveSnapshot } from "@/lib/hooks/useLive";

const RANK = { green: 0, yellow: 1, red: 2 } as const;
type Level = keyof typeof RANK;

/**
 * Fires a native browser notification when a NEW alert appears at or above the
 * operator's minimum level. Mounted once in the app shell.
 *
 * Silent no-op unless the user has explicitly granted permission in Settings —
 * we never call requestPermission() from here.
 */
export function AlertNotifier({ initialTick }: { initialTick: number }) {
  const { alerts } = useLiveSnapshot(initialTick, 15_000);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    let min: Level = "yellow";
    try {
      const v = localStorage.getItem("sentinel_min_level");
      if (v === "green" || v === "yellow" || v === "red") min = v;
    } catch {}

    const candidates = alerts.filter((a) => RANK[a.level as Level] >= RANK[min]);

    // First pass after mount only records what's already on screen — we don't
    // want a burst of notifications for alerts the user is already looking at.
    if (seen.current === null) {
      seen.current = new Set(candidates.map(keyFor));
      return;
    }

    for (const a of candidates.slice(0, 3)) {
      const key = keyFor(a);
      if (seen.current.has(key)) continue;
      seen.current.add(key);
      try {
        new Notification(`${a.level.toUpperCase()} · ${a.tokenSymbol} ${a.score.score}`, {
          body: a.title,
          tag: key,
        });
      } catch {
        // Notification construction can throw on some mobile browsers; ignore.
      }
    }

    // Keep the seen-set from growing without bound over a long session.
    if (seen.current.size > 200) {
      seen.current = new Set(candidates.map(keyFor));
    }
  }, [alerts]);

  return null;
}

function keyFor(a: { tokenSymbol: string; level: string; thesis: string }) {
  return `${a.tokenSymbol}-${a.level}-${a.thesis}`;
}
