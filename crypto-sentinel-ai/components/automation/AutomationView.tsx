"use client";

import { useState, useTransition } from "react";
import { IcArrowRight, IcAutomation, IcBolt, IcCheck, IcClose, IcLock, IcMinus, IcOperator, IcPulse, IcShield, IcSpinner, IcThreat } from "@/components/brand/icons";

import { fmtUsd, timeAgo, classNames } from "@/lib/format";
import { GlassCard, SectionTitle, Chip } from "@/components/ui/primitives";
import { toggleRuleAction, runEvaluationAction, notifyAction } from "@/app/(app)/automation/actions";
import type { Decision } from "@/lib/automation/evaluate";
import type { RuleCondition, RuleMode, TradingRule } from "@/lib/types";

const MODE_META: Record<RuleMode, { icon: React.ReactNode; label: string; tone: string }> = {
  paper: { icon: <IcAutomation className="h-3.5 w-3.5" />, label: "Paper", tone: "text-signal-blue" },
  "manual-approval": { icon: <IcOperator className="h-3.5 w-3.5" />, label: "Manual approval", tone: "text-signal-yellow" },
  automatic: { icon: <IcBolt className="h-3.5 w-3.5" />, label: "Automatic", tone: "text-signal-green" },
};

function conditionText(c: RuleCondition): string {
  const field: Record<RuleCondition["field"], string> = {
    confidence: "Confidence",
    "exchange-flow": "Exchange flow",
    "smart-money": "Smart money",
    "funding-rate": "Funding rate",
    liquidity: "Liquidity",
    "whale-action": "Whale action",
    governance: "Governance",
  };
  const op: Record<string, string> = {
    ">": "≥",
    "<": "≤",
    "==": "=",
    increasing: "increasing",
    decreasing: "decreasing",
    neutral: "neutral",
  };
  const val =
    c.value == null
      ? ""
      : typeof c.value === "number" && c.field === "liquidity"
      ? ` ${fmtUsd(c.value, { compact: true })}`
      : ` ${c.value}`;
  return `${field[c.field]} ${op[c.op]}${val}`;
}

function RuleCard({ rule, onToggle }: { rule: TradingRule; onToggle: () => void }) {
  const mode = MODE_META[rule.mode];
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={classNames("flex h-10 w-10 items-center justify-center rounded-xl", rule.side === "buy" ? "bg-signal-green/10 text-signal-green" : "bg-signal-red/10 text-signal-red")}>
            {rule.side === "buy" ? <IcArrowRight className="h-5 w-5" /> : <IcBolt className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">{rule.name}</h3>
              <Chip tone={rule.side === "buy" ? "green" : "red"}>{rule.side.toUpperCase()}</Chip>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/40">
              <span className={classNames("inline-flex items-center gap-1", mode.tone)}>{mode.icon} {mode.label}</span>
              <span>· {rule.exchange}</span>
              <span>· {rule.triggerCount} triggers</span>
              {rule.lastTriggered && <span>· last {timeAgo(rule.lastTriggered)}</span>}
            </div>
          </div>
        </div>
        <button
          onClick={onToggle}
          className={classNames(
            "relative h-6 w-11 shrink-0 rounded-full transition",
            rule.enabled ? "bg-signal-green/80" : "bg-white/15"
          )}
          aria-label="Toggle rule"
        >
          <span
            className={classNames(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
              rule.enabled ? "left-[22px]" : "left-0.5"
            )}
          />
        </button>
      </div>

      {/* Conditions as an IF/THEN chain */}
      <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
          Trigger logic
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-bold text-white/60">IF</span>
          {rule.conditions.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/75">
                {conditionText(c)}
              </span>
              {i < rule.conditions.length - 1 && (
                <span className="text-[10px] font-bold text-signal-green/70">AND</span>
              )}
            </span>
          ))}
          <span className="rounded-md bg-signal-green/15 px-1.5 py-0.5 text-[10px] font-bold text-signal-green">
            THEN {rule.side === "buy" ? "ENTER" : "EXIT"}
          </span>
        </div>
      </div>

      {/* Risk controls */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Max size", fmtUsd(rule.risk.maxPositionUsd, { compact: true })],
          ["Daily loss", fmtUsd(rule.risk.dailyLossLimitUsd, { compact: true })],
          ["Take profit", rule.risk.takeProfitPct ? `${rule.risk.takeProfitPct}%` : "—"],
          ["Stop loss", rule.risk.stopLossPct ? `${rule.risk.stopLossPct}%` : "—"],
          ["Trailing", rule.risk.trailingStopPct ? `${rule.risk.trailingStopPct}%` : "—"],
          ["Cooldown", `${rule.risk.cooldownMinutes}m`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-1.5">
            <div className="text-[9px] uppercase tracking-wide text-white/35">{label}</div>
            <div className="tabular text-xs font-semibold text-white/80">{value}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function AutomationView({
  initialRules,
  persist,
}: {
  initialRules: TradingRule[];
  persist: boolean;
}) {
  const [rules, setRules] = useState<TradingRule[]>(initialRules);
  const [emergencyStop, setEmergencyStop] = useState(false);
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const [evalErr, setEvalErr] = useState<string | null>(null);
  const [running, startEval] = useTransition();

  /**
   * Push every fired (paper) decision out to the configured channels. Best
   * effort: delivery problems must never break the evaluation UI.
   */
  async function deliverDecisions(ds: Decision[]) {
    const fired = ds.filter((d) => d.status === "executed");
    if (fired.length === 0) return;

    for (const d of fired.slice(0, 5)) {
      const title = `PAPER ${d.side.toUpperCase()} · ${d.symbol}`;
      const body = `${d.ruleName} — confidence ${d.confidence} @ $${d.price.toLocaleString()} · ${d.reason}`;

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(title, { body, tag: `${d.ruleId}-${d.symbol}` });
        } catch {}
      }
      try {
        const hook = localStorage.getItem("sentinel_webhook");
        if (hook) {
          await notifyAction(hook, { level: d.side === "buy" ? "green" : "red", title, body });
        }
      } catch {}
    }
  }

  function runEvaluation() {
    setEvalErr(null);
    startEval(async () => {
      const res = await runEvaluationAction(emergencyStop);
      if (!res.ok) {
        setEvalErr(res.error ?? "evaluation failed");
        return;
      }
      setDecisions(res.decisions);
      void deliverDecisions(res.decisions);
    });
  }

  const toggle = (id: string) => {
    let nextEnabled = false;
    setRules((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        nextEnabled = !r.enabled;
        return { ...r, enabled: nextEnabled };
      })
    );
    // Persist to Supabase when configured; optimistic update above either way.
    if (persist) {
      toggleRuleAction(id, nextEnabled).catch(() => {
        // Revert on failure.
        setRules((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !nextEnabled } : r)));
      });
    }
  };

  const activeCount = rules.filter((r) => r.enabled && !emergencyStop).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Automation</h1>
          <p className="mt-1 text-sm text-white/50">
            Rule-based execution against your own risk limits. Paper mode by default — no live keys
            are configured in this build, so nothing executes on a real exchange.
          </p>
        </div>
        <button
          onClick={() => setEmergencyStop((s) => !s)}
          className={classNames(
            "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition",
            emergencyStop
              ? "border-signal-green/40 bg-signal-green/10 text-signal-green"
              : "border-signal-red/40 bg-signal-red/10 text-signal-red hover:bg-signal-red/20"
          )}
        >
          <IcThreat className="h-4 w-4" />
          {emergencyStop ? "Resume trading" : "Emergency stop"}
        </button>
      </div>

      {emergencyStop && (
        <div className="glass rounded-2xl border border-signal-red/30 bg-signal-red/5 p-4 text-sm text-signal-red">
          <strong>Emergency stop engaged.</strong> All automated execution is halted. Open positions
          are unaffected; re-enable when ready.
        </div>
      )}

      {/* Status tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
            <IcAutomation className="h-4 w-4 text-signal-green" /> Active Rules
          </div>
          <div className="mt-1.5 tabular text-2xl font-bold text-white">{activeCount}</div>
          <div className="text-[11px] text-white/40">{rules.length} configured</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
            <IcShield className="h-4 w-4 text-signal-blue" /> Execution Mode
          </div>
          <div className="mt-1.5 text-2xl font-bold text-signal-blue">Paper</div>
          <div className="text-[11px] text-white/40">no live API keys</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
            <IcPulse className="h-4 w-4 text-signal-yellow" /> Circuit Breaker
          </div>
          <div className="mt-1.5 text-2xl font-bold text-signal-green">Armed</div>
          <div className="text-[11px] text-white/40">halts on abnormal volatility</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
            <IcLock className="h-4 w-4 text-signal-violet" /> Confidence Gate
          </div>
          <div className="mt-1.5 tabular text-2xl font-bold text-white">≥ 90</div>
          <div className="text-[11px] text-white/40">min to auto-execute</div>
        </GlassCard>
      </div>

      {/* Rule engine */}
      <div className="space-y-3">
        <SectionTitle
          title="Rule Engine"
          subtitle="Evaluate every enabled rule against the live feed · paper only, never a real order"
          right={
            <button
              onClick={runEvaluation}
              disabled={running}
              className={classNames(
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wide transition",
                "border-signal-green/40 bg-signal-green/10 text-signal-green hover:bg-signal-green/20",
                running && "opacity-60"
              )}
            >
              {running ? <IcSpinner size={14} className="animate-spin" /> : <IcBolt size={14} />}
              {running ? "Evaluating…" : "Run evaluation"}
            </button>
          }
        />

        {evalErr && (
          <GlassCard className="border-signal-red/30 bg-signal-red/5 p-3 text-[12px] text-signal-red">
            {evalErr}
          </GlassCard>
        )}

        {!decisions && !evalErr && (
          <GlassCard className="p-5 text-[12px] leading-relaxed text-white/45">
            Run the engine to see, for every enabled rule, whether it fires against the current
            signal feed — and exactly which conditions passed or blocked it. Decisions are written
            to your trade log as <span className="text-signal-green">paper</span> entries.
          </GlassCard>
        )}

        {decisions && decisions.length === 0 && (
          <GlassCard className="p-5 text-center text-[12px] text-white/45">
            No enabled rules to evaluate.
          </GlassCard>
        )}

        {decisions && decisions.length > 0 && (
          <div className="space-y-2.5">
            {decisions.map((d, i) => {
              const meta =
                d.status === "executed"
                  ? { icon: <IcCheck size={14} />, tone: "text-signal-green", label: "Paper fill" }
                  : d.status === "missed"
                  ? { icon: <IcMinus size={14} />, tone: "text-signal-yellow", label: "No candidate" }
                  : { icon: <IcClose size={14} />, tone: "text-signal-red", label: "Blocked" };
              return (
                <GlassCard key={i} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={classNames("inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide", meta.tone)}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className="text-sm font-semibold text-white">{d.ruleName}</span>
                    {d.symbol !== "—" && <Chip tone={d.side === "buy" ? "green" : "red"}>{d.side.toUpperCase()} {d.symbol}</Chip>}
                    {d.confidence > 0 && (
                      <span className="tabular text-[11px] text-white/40">confidence {d.confidence}</span>
                    )}
                    {d.qty > 0 && (
                      <span className="tabular ml-auto text-[11px] text-white/50">
                        {d.qty.toFixed(4)} @ {fmtUsd(d.price, { dp: d.price < 1 ? 4 : 2 })}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-white/55">{d.reason}</p>
                  {(d.passed.length > 0 || d.failed.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {d.passed.map((p, k) => (
                        <span key={`p${k}`} className="inline-flex items-center gap-1 rounded-md border border-signal-green/20 bg-signal-green/5 px-2 py-0.5 text-[10px] text-signal-green/90">
                          <IcCheck size={10} /> {p}
                        </span>
                      ))}
                      {d.failed.map((f, k) => (
                        <span key={`f${k}`} className="inline-flex items-center gap-1 rounded-md border border-signal-red/20 bg-signal-red/5 px-2 py-0.5 text-[10px] text-signal-red/90">
                          <IcClose size={10} /> {f}
                        </span>
                      ))}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SectionTitle title="Trading Rules" subtitle="IF multi-source conditions hold, THEN act within risk limits" />
        <div className="space-y-3">
          {rules.map((r) => (
            <RuleCard key={r.id} rule={r} onToggle={() => toggle(r.id)} />
          ))}
        </div>
      </div>

      <GlassCard className="p-5">
        <div className="flex items-start gap-3">
          <IcShield className="mt-0.5 h-5 w-5 shrink-0 text-signal-green" />
          <div className="text-[12px] leading-relaxed text-white/50">
            <strong className="text-white/70">Safety model.</strong> Every rule enforces max position
            size, daily loss limits, stop-loss, trailing stops and cooldowns. Automatic mode requires
            an explicit confidence gate plus corroboration across independent sources. Manual-approval
            mode surfaces a proposed trade for one-click confirmation. A global emergency stop and
            volatility circuit breaker can halt all execution instantly. Connecting a live exchange
            key is intentionally not enabled in this build.
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
