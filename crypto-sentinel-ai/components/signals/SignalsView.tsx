"use client";

import { useMemo, useState } from "react";
import { useLiveSnapshot } from "@/lib/hooks/useLive";
import { AlertCard } from "@/components/alerts/AlertCard";
import { classNames } from "@/lib/format";
import type { AlertLevel } from "@/lib/types";

const FILTERS: { key: AlertLevel | "all"; label: string; dot: string }[] = [
  { key: "all", label: "All", dot: "bg-white/50" },
  { key: "red", label: "Red · Risk", dot: "bg-signal-red" },
  { key: "yellow", label: "Yellow · High Prob.", dot: "bg-signal-yellow" },
  { key: "green", label: "Green · Accumulation", dot: "bg-signal-green" },
];

export function SignalsView({ initialTick }: { initialTick: number }) {
  const { alerts, now } = useLiveSnapshot(initialTick, 6000);
  const [filter, setFilter] = useState<AlertLevel | "all">("all");
  const [minConf, setMinConf] = useState(50);

  const filtered = useMemo(
    () =>
      alerts.filter(
        (a) => (filter === "all" || a.level === filter) && a.score.score >= minConf
      ),
    [alerts, filter, minConf]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Signal Feed</h1>
        <p className="mt-1 text-sm text-white/50">
          Every alert is corroborated across independent sources. Expand any card for the full
          confidence breakdown, supporting &amp; contradicting evidence, and historical analogs.
        </p>
      </div>

      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={classNames(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                filter === f.key
                  ? "border-white/20 bg-white/[0.06] text-white"
                  : "border-white/8 bg-transparent text-white/50 hover:text-white/80"
              )}
            >
              <span className={classNames("h-1.5 w-1.5 rounded-full", f.dot)} />
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-widest text-white/40">
            Min confidence
          </span>
          <input
            type="range"
            min={40}
            max={95}
            value={minConf}
            onChange={(e) => setMinConf(Number(e.target.value))}
            className="w-40 accent-signal-green"
          />
          <span className="tabular w-8 text-sm font-semibold text-signal-green">{minConf}</span>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-sm text-white/40">
            No alerts match these filters right now.
          </div>
        )}
        {filtered.map((a) => (
          <AlertCard key={`${a.tokenSymbol}-${a.thesis === "distribution" ? "short" : "long"}`} alert={a} now={now} />
        ))}
      </div>
    </div>
  );
}
