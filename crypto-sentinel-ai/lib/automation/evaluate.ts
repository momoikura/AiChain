/**
 * Rule evaluator — turns stored trading rules into explainable PAPER decisions.
 *
 * SAFETY: this module decides and records only. It never places, cancels or
 * transfers anything on an exchange. Every decision is marked `paper: true`.
 *
 * Each rule's conditions are checked against the live engine snapshot for each
 * candidate token; a rule fires only when EVERY condition passes, and the
 * reason string records exactly which checks passed or failed.
 */

import type { Alert, Signal, SignalKind, Token, TradingRule } from "@/lib/types";

export interface Decision {
  ruleId: string;
  ruleName: string;
  symbol: string;
  side: "buy" | "sell";
  status: "executed" | "rejected" | "missed";
  confidence: number;
  price: number;
  qty: number;
  reason: string;
  passed: string[];
  failed: string[];
}

const has = (sigs: Signal[], ...kinds: SignalKind[]) =>
  sigs.some((s) => kinds.includes(s.kind));

/** Evaluate one condition against a token + its alert/signals. */
function checkCondition(
  c: TradingRule["conditions"][number],
  token: Token,
  alert: Alert,
  sigs: Signal[]
): { ok: boolean; label: string } {
  switch (c.field) {
    case "confidence": {
      const need = Number(c.value ?? 0);
      const ok = c.op === "<" ? alert.score.score <= need : alert.score.score >= need;
      return { ok, label: `confidence ${alert.score.score} (need ${c.op} ${need})` };
    }
    case "exchange-flow": {
      const inflow = has(sigs, "exchange-inflow");
      const outflow = has(sigs, "exchange-outflow");
      const ok = c.op === "increasing" ? inflow : outflow;
      return {
        ok,
        label: `exchange flow ${c.op} (${outflow ? "outflow" : inflow ? "inflow" : "flat"})`,
      };
    }
    case "smart-money": {
      const acc = has(sigs, "whale-accumulation", "vc-accumulation", "smart-money-ape", "insider-activity");
      const ok = c.op === "decreasing" ? !acc : acc;
      return { ok, label: `smart money ${c.op}${acc ? " (accumulating)" : ""}` };
    }
    case "funding-rate": {
      const extreme = has(sigs, "funding-extreme");
      const neutral = Math.abs(token.fundingRate) < 0.05 && !extreme;
      const ok = c.op === "neutral" ? neutral : !neutral;
      return { ok, label: `funding ${(token.fundingRate * 100).toFixed(3)}% ${c.op}` };
    }
    case "liquidity": {
      const need = Number(c.value ?? 0);
      const ok = token.liquidity >= need;
      return { ok, label: `liquidity ${Math.round(token.liquidity).toLocaleString()} ≥ ${need.toLocaleString()}` };
    }
    case "whale-action": {
      const dist = has(sigs, "whale-distribution");
      const ok = c.op === "decreasing" ? dist : !dist;
      return { ok, label: `whale action ${c.op}${dist ? " (distributing)" : ""}` };
    }
    case "governance": {
      const neg = has(sigs, "governance-negative");
      const ok = String(c.value) === "negative" ? neg : !neg;
      return { ok, label: `governance ${neg ? "negative" : "neutral/positive"}` };
    }
    default:
      return { ok: false, label: `unknown condition ${c.field}` };
  }
}

export interface EvaluateInput {
  rules: TradingRule[];
  tokens: Token[];
  alerts: Alert[];
  signalsBySymbol: Record<string, Signal[]>;
  emergencyStop: boolean;
  now: number;
}

export function evaluateRules({
  rules,
  tokens,
  alerts,
  signalsBySymbol,
  emergencyStop,
  now,
}: EvaluateInput): Decision[] {
  const decisions: Decision[] = [];
  const tokenBySymbol = new Map(tokens.map((t) => [t.symbol, t]));

  for (const rule of rules) {
    if (!rule.enabled) continue;

    // Global kill switch wins over everything.
    if (emergencyStop) {
      decisions.push(blocked(rule, "emergency stop engaged"));
      continue;
    }
    // Per-rule cooldown.
    if (rule.lastTriggered && now - rule.lastTriggered < rule.risk.cooldownMinutes * 60_000) {
      const mins = Math.ceil((rule.risk.cooldownMinutes * 60_000 - (now - rule.lastTriggered)) / 60_000);
      decisions.push(blocked(rule, `cooldown active (${mins}m remaining)`));
      continue;
    }

    // Buy rules look at bullish theses, sell rules at distribution theses.
    const candidates = alerts.filter((a) =>
      rule.side === "buy" ? a.thesis !== "distribution" : a.thesis === "distribution"
    );
    if (candidates.length === 0) {
      decisions.push(blocked(rule, "no matching thesis in the current feed", "missed"));
      continue;
    }

    // Evaluate the strongest candidate first.
    let fired = false;
    for (const alert of candidates.slice(0, 6)) {
      const token = tokenBySymbol.get(alert.tokenSymbol);
      if (!token) continue;
      const sigs = signalsBySymbol[alert.tokenSymbol] ?? [];

      const passed: string[] = [];
      const failed: string[] = [];
      for (const c of rule.conditions) {
        const r = checkCondition(c, token, alert, sigs);
        (r.ok ? passed : failed).push(r.label);
      }

      if (failed.length === 0) {
        const qty = token.price > 0 ? rule.risk.maxPositionUsd / token.price : 0;
        decisions.push({
          ruleId: rule.id,
          ruleName: rule.name,
          symbol: token.symbol,
          side: rule.side,
          status: "executed", // paper fill
          confidence: alert.score.score,
          price: token.price,
          qty,
          reason: `PAPER ${rule.side.toUpperCase()} · all ${rule.conditions.length} conditions met · ${passed.join(" · ")}`,
          passed,
          failed,
        });
        fired = true;
        break;
      }
    }

    if (!fired) {
      // Report why the best candidate was rejected.
      const alert = candidates[0];
      const token = tokenBySymbol.get(alert.tokenSymbol);
      const sigs = signalsBySymbol[alert.tokenSymbol] ?? [];
      const passed: string[] = [];
      const failed: string[] = [];
      if (token) {
        for (const c of rule.conditions) {
          const r = checkCondition(c, token, alert, sigs);
          (r.ok ? passed : failed).push(r.label);
        }
      }
      decisions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        symbol: alert?.tokenSymbol ?? "—",
        side: rule.side,
        status: "rejected",
        confidence: alert?.score.score ?? 0,
        price: token?.price ?? 0,
        qty: 0,
        reason: failed.length
          ? `Blocked — ${failed.join(" · ")}`
          : "Blocked — conditions not satisfied",
        passed,
        failed,
      });
    }
  }

  return decisions;
}

function blocked(rule: TradingRule, why: string, status: Decision["status"] = "rejected"): Decision {
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    symbol: "—",
    side: rule.side,
    status,
    confidence: 0,
    price: 0,
    qty: 0,
    reason: `Blocked — ${why}`,
    passed: [],
    failed: [why],
  };
}
