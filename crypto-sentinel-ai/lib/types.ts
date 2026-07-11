/**
 * Crypto Sentinel AI — Core domain types.
 *
 * These types are the contract between the data layer (source adapters),
 * the intelligence engine (scoring), and the UI. Everything the platform
 * reasons about flows through these shapes.
 */

// ---------------------------------------------------------------------------
// Data sources & categories
// ---------------------------------------------------------------------------

export type SourceCategory =
  | "on-chain"
  | "market"
  | "analytics"
  | "defi"
  | "developer"
  | "governance"
  | "news"
  | "social";

export interface DataSource {
  id: string;
  name: string;
  category: SourceCategory;
  /** 0–100 — how much we trust this source's raw output historically. */
  reliability: number;
  /** Whether a live API key is configured. Simulated when false. */
  live: boolean;
  status: "operational" | "degraded" | "offline" | "simulated";
  /** ms since last successful poll. */
  latencyMs: number;
  /**
   * Cost tier of the *real* provider:
   *  - "free"    → keyless or free public API (CoinGecko, Etherscan, GitHub…)
   *  - "freemium"→ generous free tier, paid for higher limits
   *  - "paid"    → subscription required (Nansen, Glassnode…)
   * The app itself runs at $0 regardless; this only guides which sources you
   * can wire live for free.
   */
  cost: "free" | "freemium" | "paid";
}

// ---------------------------------------------------------------------------
// Signals — the atomic evidence unit produced by detectors
// ---------------------------------------------------------------------------

export type SignalKind =
  | "whale-accumulation"
  | "whale-distribution"
  | "exchange-outflow"
  | "exchange-inflow"
  | "liquidity-add"
  | "liquidity-remove"
  | "listing-rumor"
  | "listing-confirmed"
  | "vc-accumulation"
  | "treasury-movement"
  | "insider-activity"
  | "token-unlock"
  | "large-burn"
  | "large-mint"
  | "bridge-activity"
  | "protocol-launch"
  | "partnership"
  | "governance-approved"
  | "governance-negative"
  | "dev-activity-spike"
  | "options-anomaly"
  | "funding-extreme"
  | "liquidation-cascade"
  | "momentum-divergence"
  | "relative-strength"
  | "stablecoin-inflow"
  // --- meme-coin specific ---
  | "social-surge"
  | "influencer-post"
  | "holder-spike"
  | "smart-money-ape"
  | "volume-surge"
  | "lp-locked"
  | "pumpfun-graduation"
  | "sniper-cluster"
  | "supply-concentration";

/** Direction a signal pushes the thesis. */
export type SignalPolarity = "bullish" | "bearish" | "neutral";

export interface Signal {
  id: string;
  tokenSymbol: string;
  kind: SignalKind;
  polarity: SignalPolarity;
  /** 0–100 strength of this individual observation. */
  strength: number;
  /** 0–100 confidence in the source/measurement itself. */
  reliability: number;
  /** How many standard deviations from the token's own baseline. */
  anomalyZ: number;
  sourceId: string;
  sourceName: string;
  category: SourceCategory;
  /** Human-readable one-liner shown in evidence lists. */
  headline: string;
  detail: string;
  /** Unix ms. */
  timestamp: number;
  /** Whether an on-chain event corroborates this (raises confidence). */
  onChainConfirmed: boolean;
}

// ---------------------------------------------------------------------------
// Confidence scoring output
// ---------------------------------------------------------------------------

export interface ConfidenceFactor {
  label: string;
  category: SourceCategory;
  polarity: SignalPolarity;
  /** Contribution to the final score in points (can be negative). */
  contribution: number;
  passed: boolean;
  detail: string;
}

export interface ScoreBreakdown {
  /** 0–100 final confidence. */
  score: number;
  /** Weighted sub-scores that compose the final number. */
  components: {
    corroboration: number; // independent sources agreeing
    sourceReliability: number; // quality of those sources
    onChainConfirmation: number; // hard on-chain evidence
    anomaly: number; // statistical abnormality
    freshness: number; // recency of the evidence
    historicalAccuracy: number; // how similar past setups resolved
  };
  supporting: ConfidenceFactor[];
  contradicting: ConfidenceFactor[];
  /** Number of independent source categories that agree. */
  independentCategories: number;
}

// ---------------------------------------------------------------------------
// Alerts — the surfaced, actionable conclusion
// ---------------------------------------------------------------------------

export type AlertLevel = "green" | "yellow" | "red";
export type AlertThesis = "accumulation" | "breakout" | "distribution" | "volatility";

export interface HistoricalAnalog {
  tokenSymbol: string;
  date: string;
  setup: string;
  outcome: string;
  return7d: number;
}

export interface Alert {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  level: AlertLevel;
  thesis: AlertThesis;
  title: string;
  summary: string;
  score: ScoreBreakdown;
  signals: Signal[];
  analogs: HistoricalAnalog[];
  risks: string[];
  createdAt: number;
  /** Price at time of alert, for tracking realized outcome. */
  priceAtAlert: number;
}

// ---------------------------------------------------------------------------
// Tokens & market data
// ---------------------------------------------------------------------------

export type Chain =
  | "ethereum"
  | "solana"
  | "bsc"
  | "base"
  | "arbitrum"
  | "tron"
  | "avalanche";

export type TokenSector = "meme" | "l1" | "l2" | "defi" | "infra" | "oracle";

export interface Token {
  symbol: string;
  name: string;
  chain: Chain;
  sector: TokenSector;
  /** Convenience flag — true when sector === "meme". */
  isMeme: boolean;
  price: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  fdv: number;
  liquidity: number;
  fundingRate: number;
  openInterest: number;
  circulatingSupply: number;
  totalSupply: number;
  /** Rolling price history for sparklines (oldest → newest). */
  spark: number[];
  /** Composite live sentinel score 0–100 (max over active theses). */
  sentinelScore: number;
  topLevel: AlertLevel;
}

// ---------------------------------------------------------------------------
// Automation / trading rules
// ---------------------------------------------------------------------------

export type RuleMode = "paper" | "manual-approval" | "automatic";

export type ConditionField =
  | "confidence"
  | "exchange-flow"
  | "smart-money"
  | "funding-rate"
  | "liquidity"
  | "whale-action"
  | "governance";

export type ConditionOp = ">" | "<" | "==" | "increasing" | "decreasing" | "neutral";

export interface RuleCondition {
  field: ConditionField;
  op: ConditionOp;
  value?: number | string;
}

export interface TradingRule {
  id: string;
  name: string;
  enabled: boolean;
  mode: RuleMode;
  side: "buy" | "sell";
  conditions: RuleCondition[];
  risk: {
    maxPositionUsd: number;
    dailyLossLimitUsd: number;
    takeProfitPct: number;
    stopLossPct: number;
    trailingStopPct: number;
    cooldownMinutes: number;
  };
  exchange: string;
  lastTriggered?: number;
  triggerCount: number;
}

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------

export interface Position {
  symbol: string;
  name: string;
  qty: number;
  avgEntry: number;
  price: number;
  allocationPct: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  status: "executed" | "rejected" | "missed";
  qty: number;
  price: number;
  pnl?: number;
  ruleName: string;
  reason: string;
  timestamp: number;
  paper: boolean;
}

export interface PortfolioStats {
  totalValue: number;
  totalPnl: number;
  totalPnlPct: number;
  winRate: number;
  sharpe: number;
  maxDrawdown: number;
  aiWinRate: number;
  equityCurve: number[];
}
