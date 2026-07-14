"use client";

import Link from "next/link";
import { useState } from "react";
import {
  IcChevron,
  IcCheck,
  IcClose,
  IcArrowUpRight,
  IcClock,
} from "@/components/brand/icons";
import type { Alert } from "@/lib/types";
import { classNames, timeAgo } from "@/lib/format";
import { CategoryTag, Chip, LevelBadge } from "@/components/ui/primitives";
import { ConfidenceRing, ComponentBar } from "@/components/ui/charts";

const LEVEL_LABEL: Record<Alert["level"], string> = {
  green: "Possible accumulation",
  yellow: "High-probability move",
  red: "High-risk / sell pressure",
};

const LEVEL_ACCENT: Record<Alert["level"], string> = {
  green: "before:bg-signal-green",
  yellow: "before:bg-signal-yellow",
  red: "before:bg-signal-red",
};

export function AlertCard({ alert, now }: { alert: Alert; now: number }) {
  const [open, setOpen] = useState(false);
  const b = alert.score;

  return (
    <div
      className={classNames(
        "glass glass-hover relative overflow-hidden rounded-2xl p-4 pl-5",
        "before:absolute before:inset-y-0 before:left-0 before:w-1",
        LEVEL_ACCENT[alert.level]
      )}
    >
      <div className="flex items-start gap-4">
        <div className="hidden shrink-0 sm:block">
          <ConfidenceRing score={b.score} level={alert.level} size={78} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={alert.level} label={LEVEL_LABEL[alert.level]} />
            <span className="text-[11px] text-white/40">
              <IcClock className="mr-1 inline h-3 w-3" />
              {timeAgo(alert.createdAt, now)}
            </span>
            <span className="ml-auto flex items-center gap-1 text-[11px] text-white/40">
              {b.independentCategories} independent categories
            </span>
          </div>

          <Link
            href={`/tokens/${alert.tokenSymbol}`}
            className="group mt-2 flex items-center gap-2"
          >
            <h3 className="text-base font-semibold text-white group-hover:text-signal-green">
              {alert.title}
            </h3>
            <IcArrowUpRight className="h-4 w-4 text-white/30 group-hover:text-signal-green" />
          </Link>
          <p className="mt-1 text-sm leading-relaxed text-white/60">{alert.summary}</p>

          {/* Top supporting factors */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {b.supporting.slice(0, 5).map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md border border-signal-green/20 bg-signal-green/5 px-2 py-0.5 text-[11px] text-signal-green/90"
              >
                <IcCheck className="h-3 w-3" />
                {f.label}
              </span>
            ))}
            {b.contradicting.slice(0, 2).map((f, i) => (
              <span
                key={`c${i}`}
                className="inline-flex items-center gap-1 rounded-md border border-signal-red/20 bg-signal-red/5 px-2 py-0.5 text-[11px] text-signal-red/90"
              >
                <IcClose className="h-3 w-3" />
                {f.label}
              </span>
            ))}
          </div>

          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-white/50 transition hover:text-white"
          >
            <IcChevron className={classNames("h-4 w-4 transition", open && "rotate-180")} />
            {open ? "Hide reasoning" : "Explain this alert"}
          </button>

          {open && (
            <div className="mt-4 grid animate-fadeUp gap-5 border-t border-white/8 pt-4 lg:grid-cols-2">
              {/* Score composition */}
              <div>
                <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/50">
                  Confidence composition
                </h4>
                <div className="space-y-2.5">
                  <ComponentBar label="Corroboration (independent sources)" value={b.components.corroboration} />
                  <ComponentBar label="On-chain confirmation" value={b.components.onChainConfirmation} color="#4d9dff" />
                  <ComponentBar label="Source reliability" value={b.components.sourceReliability} color="#9b7bff" />
                  <ComponentBar label="Statistical anomaly" value={b.components.anomaly} color="#f5c542" />
                  <ComponentBar label="Evidence freshness" value={b.components.freshness} color="#38e8e0" />
                  <ComponentBar label="Historical accuracy" value={b.components.historicalAccuracy} color="#22e39b" />
                </div>
              </div>

              {/* Evidence */}
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-signal-green">
                    Supporting evidence
                  </h4>
                  <ul className="space-y-1.5">
                    {b.supporting.slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-white/70">
                        <IcCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-green" />
                        <span className="flex-1">
                          <span className="text-white/85">{f.label}</span> — {f.detail}
                        </span>
                        <CategoryTag category={f.category} />
                      </li>
                    ))}
                  </ul>
                </div>

                {b.contradicting.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-signal-red">
                      Contradicting evidence
                    </h4>
                    <ul className="space-y-1.5">
                      {b.contradicting.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-white/70">
                          <IcClose className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-red" />
                          <span className="flex-1">
                            <span className="text-white/85">{f.label}</span> — {f.detail}
                          </span>
                          <CategoryTag category={f.category} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Historical analogs */}
                <div>
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/50">
                    Historical analogs
                  </h4>
                  <div className="space-y-1.5">
                    {alert.analogs.map((a, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] px-3 py-1.5 text-[12px]">
                        <span className="text-white/60">
                          <span className="font-semibold text-white/80">{a.tokenSymbol}</span> · {a.date} · {a.setup}
                        </span>
                        <span className={classNames("tabular font-semibold", a.return7d >= 0 ? "text-signal-green" : "text-signal-red")}>
                          {a.return7d >= 0 ? "+" : ""}
                          {a.return7d}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks */}
                <div>
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/50">
                    Risks & uncertainties
                  </h4>
                  <ul className="space-y-1">
                    {alert.risks.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-white/45">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/30" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
