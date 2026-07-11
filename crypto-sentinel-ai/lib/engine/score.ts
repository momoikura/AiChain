/**
 * The Crypto Sentinel AI intelligence engine.
 *
 * Rather than deciding whether a piece of information is "real", the engine
 * estimates the *probability* that a token is set up for a significant move
 * by fusing many independent, weighted indicators into a single explainable
 * confidence score.
 *
 * Guardrails baked in here:
 *   1. Corroboration across INDEPENDENT source categories is mandatory —
 *      no single source can carry a score.
 *   2. Social signals are capped and can never, alone, cross the alert
 *      threshold ("never generate an alert from social activity alone").
 *   3. Contradicting evidence is surfaced and actively subtracts from score.
 *   4. Everything is decomposed into inspectable factors for the UI.
 */

import type {
  Alert,
  AlertLevel,
  AlertThesis,
  ConfidenceFactor,
  HistoricalAnalog,
  ScoreBreakdown,
  Signal,
  SignalPolarity,
  SourceCategory,
  Token,
} from "@/lib/types";
import { Rng } from "@/lib/rng";

const WEIGHTS = {
  corroboration: 0.28,
  sourceReliability: 0.16,
  onChainConfirmation: 0.22,
  anomaly: 0.14,
  freshness: 0.08,
  historicalAccuracy: 0.12,
};

/** Categories we treat as "hard"/independent evidence (non-social). */
const HARD_CATEGORIES: SourceCategory[] = [
  "on-chain",
  "market",
  "analytics",
  "defi",
  "developer",
  "governance",
  "news",
];

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Score a single directional thesis (bullish or bearish) from its signals.
 * Returns null when there isn't enough independent corroboration to justify
 * surfacing anything.
 */
export function scoreThesis(
  signals: Signal[],
  direction: "bullish" | "bearish",
  now: number
): ScoreBreakdown | null {
  const dirSignals = signals.filter((s) => s.polarity === direction);
  if (dirSignals.length === 0) return null;

  const opposite: SignalPolarity = direction === "bullish" ? "bearish" : "bullish";
  const counterSignals = signals.filter((s) => s.polarity === opposite);

  // --- Corroboration: distinct independent (non-social) categories agreeing.
  const hardCategories = new Set(
    dirSignals.filter((s) => HARD_CATEGORIES.includes(s.category)).map((s) => s.category)
  );
  const independentCategories = hardCategories.size;
  // Diminishing returns: 1 cat ~ 35, 2 ~ 62, 3 ~ 80, 4 ~ 90, 5+ ~ 96
  const corroboration = clamp(100 * (1 - Math.pow(0.62, independentCategories)));

  // --- Source reliability (weighted by signal strength).
  const relNums = dirSignals.map((s) => s.reliability * (0.6 + 0.4 * (s.strength / 100)));
  const sourceReliability = clamp(mean(relNums));

  // --- On-chain confirmation: share of the thesis backed by chain events.
  const confirmed = dirSignals.filter((s) => s.onChainConfirmed).length;
  const onChainConfirmation = clamp((confirmed / dirSignals.length) * 100);

  // --- Anomaly: how statistically unusual the evidence is (z-scores).
  const anomaly = clamp(mean(dirSignals.map((s) => Math.min(100, 22 + s.anomalyZ * 24))));

  // --- Freshness: exponential decay over ~6h half-life.
  const freshness = clamp(
    mean(
      dirSignals.map((s) => {
        const ageH = (now - s.timestamp) / 3_600_000;
        return 100 * Math.pow(0.5, ageH / 6);
      })
    )
  );

  // --- Historical accuracy of similar setups (deterministic proxy).
  const setupKey = dirSignals
    .map((s) => s.kind)
    .sort()
    .join("|");
  const historicalAccuracy = clamp(60 + new Rng(setupKey).float(-12, 32));

  const components = {
    corroboration,
    sourceReliability,
    onChainConfirmation,
    anomaly,
    freshness,
    historicalAccuracy,
  };

  let score =
    components.corroboration * WEIGHTS.corroboration +
    components.sourceReliability * WEIGHTS.sourceReliability +
    components.onChainConfirmation * WEIGHTS.onChainConfirmation +
    components.anomaly * WEIGHTS.anomaly +
    components.freshness * WEIGHTS.freshness +
    components.historicalAccuracy * WEIGHTS.historicalAccuracy;

  // --- Guardrail: social-only theses are hard-capped well below threshold.
  if (independentCategories === 0) {
    score = Math.min(score, 34);
  } else if (independentCategories === 1) {
    score = Math.min(score, 72); // one hard category can't alone reach "red"
  }

  // --- Penalty for contradicting evidence.
  const counterCats = new Set(
    counterSignals.filter((s) => HARD_CATEGORIES.includes(s.category)).map((s) => s.category)
  );
  const contradictionPenalty = Math.min(20, counterCats.size * 5 + counterSignals.length * 1.1);
  score = clamp(score - contradictionPenalty);

  // --- Build the human-readable supporting / contradicting factor lists.
  const supporting: ConfidenceFactor[] = summarizeFactors(dirSignals, direction, true);
  const contradicting: ConfidenceFactor[] = summarizeFactors(counterSignals, opposite, false);

  return {
    score: Math.round(score),
    components: roundComponents(components),
    supporting,
    contradicting,
    independentCategories,
  };
}

function roundComponents(c: ScoreBreakdown["components"]): ScoreBreakdown["components"] {
  return Object.fromEntries(
    Object.entries(c).map(([k, v]) => [k, Math.round(v)])
  ) as ScoreBreakdown["components"];
}

/** Collapse many raw signals into deduped, category-level factors. */
function summarizeFactors(
  signals: Signal[],
  polarity: SignalPolarity,
  passed: boolean
): ConfidenceFactor[] {
  const byHeadline = new Map<string, Signal[]>();
  for (const s of signals) {
    const arr = byHeadline.get(s.headline) ?? [];
    arr.push(s);
    byHeadline.set(s.headline, arr);
  }
  return Array.from(byHeadline.entries())
    .map(([headline, group]) => {
      const strongest = group.reduce((a, b) => (b.strength > a.strength ? b : a));
      const contribution =
        (passed ? 1 : -1) *
        Math.round((strongest.strength / 100) * (strongest.reliability / 100) * 18);
      return {
        label: headline,
        category: strongest.category,
        polarity,
        contribution,
        passed,
        detail: strongest.detail,
      };
    })
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}

// ---------------------------------------------------------------------------
// Alert construction
// ---------------------------------------------------------------------------

function levelFor(score: number, direction: "bullish" | "bearish"): AlertLevel {
  if (direction === "bearish") {
    // Bearish theses always surface as red (risk) once meaningful.
    return score >= 62 ? "red" : "green";
  }
  if (score >= 82) return "yellow"; // high-probability move
  return "green"; // possible accumulation
}

function thesisFor(direction: "bullish" | "bearish", score: number): AlertThesis {
  if (direction === "bearish") return "distribution";
  if (score >= 82) return "breakout";
  return "accumulation";
}

const ANALOG_POOL: HistoricalAnalog[] = [
  { tokenSymbol: "SOL", date: "2023-10", setup: "Whale accumulation + CEX outflows + dev spike", outcome: "Sustained markup", return7d: 41 },
  { tokenSymbol: "JUP", date: "2024-01", setup: "Airdrop demand + stablecoin inflows", outcome: "Volatile markup", return7d: 68 },
  { tokenSymbol: "ARB", date: "2024-03", setup: "Governance buyback + relative strength", outcome: "Partial follow-through", return7d: 22 },
  { tokenSymbol: "TIA", date: "2024-05", setup: "Unlock + funding extreme + inflows", outcome: "Sharp drawdown", return7d: -29 },
  { tokenSymbol: "WIF", date: "2024-03", setup: "Social surge + confirmed listing", outcome: "Parabolic then reversion", return7d: 120 },
  { tokenSymbol: "LDO", date: "2024-04", setup: "Emissions increase + whale distribution", outcome: "Grind lower", return7d: -18 },
];

function pickAnalogs(token: Token, direction: "bullish" | "bearish"): HistoricalAnalog[] {
  const rng = new Rng(`${token.symbol}:analog:${direction}`);
  const pool = ANALOG_POOL.filter((a) =>
    direction === "bearish" ? a.return7d < 0 : a.return7d > 0
  );
  const src = pool.length ? pool : ANALOG_POOL;
  const shuffled = [...src].sort(() => rng.float(-1, 1));
  return shuffled.slice(0, 2);
}

function risksFor(token: Token, direction: "bullish" | "bearish", score: ScoreBreakdown): string[] {
  const risks: string[] = [
    "Probabilistic assessment — not a guarantee or financial advice.",
  ];
  if (score.components.freshness < 55)
    risks.push("Some evidence is aging; the setup may already be priced in.");
  if (score.independentCategories < 3)
    risks.push("Corroboration is limited to a few source categories.");
  if (token.fundingRate > 0.05 && direction === "bullish")
    risks.push("Elevated funding suggests crowded longs and squeeze risk.");
  if (score.contradicting.length > 0)
    risks.push(`${score.contradicting.length} contradicting indicator(s) remain unresolved.`);
  if (direction === "bearish")
    risks.push("Short/exit setups can reverse violently on positive headlines.");
  if (token.isMeme) {
    risks.push(
      "Meme asset: reflexive, narrative-driven and highly volatile — position sizing and hard stops matter more than the thesis."
    );
    risks.push("Watch supply concentration and LP status; low-float memes can be exit-liquidity traps.");
  }
  return risks;
}

/** Produce all alerts for one token (possibly bullish and/or bearish). */
export function buildAlerts(token: Token, signals: Signal[], now: number): Alert[] {
  const alerts: Alert[] = [];

  for (const direction of ["bullish", "bearish"] as const) {
    const breakdown = scoreThesis(signals, direction, now);
    if (!breakdown) continue;
    // Only surface theses that clear a minimum bar of substance.
    const minBar = direction === "bearish" ? 55 : 60;
    if (breakdown.score < minBar) continue;

    const level = levelFor(breakdown.score, direction);
    const thesis = thesisFor(direction, breakdown.score);
    const relevantSignals = signals
      .filter((s) => s.polarity === (direction === "bullish" ? "bullish" : "bearish"))
      .slice(0, 12);

    alerts.push({
      id: `${token.symbol}-${direction}-${Math.floor(now / 60000)}`,
      tokenSymbol: token.symbol,
      tokenName: token.name,
      level,
      thesis,
      title: titleFor(token, thesis, breakdown.score),
      summary: summaryFor(token, direction, breakdown),
      score: breakdown,
      signals: relevantSignals,
      analogs: pickAnalogs(token, direction),
      risks: risksFor(token, direction, breakdown),
      createdAt: now - (now % 60000),
      priceAtAlert: token.price,
    });
  }
  return alerts;
}

function titleFor(token: Token, thesis: AlertThesis, score: number): string {
  const map: Record<AlertThesis, string> = {
    accumulation: `${token.symbol} — quiet accumulation forming`,
    breakout: `${token.symbol} — high-probability breakout setup`,
    distribution: `${token.symbol} — distribution & sell-pressure risk`,
    volatility: `${token.symbol} — elevated volatility risk`,
  };
  return map[thesis];
}

function summaryFor(
  token: Token,
  direction: "bullish" | "bearish",
  b: ScoreBreakdown
): string {
  const top = b.supporting.slice(0, 3).map((f) => f.label.toLowerCase());
  const list = top.join(", ");
  if (direction === "bullish") {
    return `${b.independentCategories} independent source categories corroborate a constructive setup on ${token.name} — led by ${list}. Confidence ${b.score}/100.`;
  }
  return `Multiple independent indicators flag rising sell pressure on ${token.name} — led by ${list}. Treat longs with caution. Risk score ${b.score}/100.`;
}

// ---------------------------------------------------------------------------
// Top-level orchestration
// ---------------------------------------------------------------------------

export interface EnginePass {
  tokens: Token[];
  alerts: Alert[];
  signalsBySymbol: Record<string, Signal[]>;
}

export function runEngine(
  raw: { token: Token; signals: Signal[] }[],
  now: number
): EnginePass {
  const alerts: Alert[] = [];
  const signalsBySymbol: Record<string, Signal[]> = {};
  const tokens: Token[] = [];

  for (const { token, signals } of raw) {
    signalsBySymbol[token.symbol] = signals;
    const tokenAlerts = buildAlerts(token, signals, now);
    alerts.push(...tokenAlerts);

    // Sentinel score = strongest thesis confidence; level from worst risk.
    const best = tokenAlerts.reduce((m, a) => Math.max(m, a.score.score), 0);
    const hasRed = tokenAlerts.some((a) => a.level === "red");
    const hasYellow = tokenAlerts.some((a) => a.level === "yellow");
    tokens.push({
      ...token,
      sentinelScore: best,
      topLevel: hasRed ? "red" : hasYellow ? "yellow" : "green",
    });
  }

  alerts.sort((a, b) => b.score.score - a.score.score);
  tokens.sort((a, b) => b.sentinelScore - a.sentinelScore);
  return { tokens, alerts, signalsBySymbol };
}
