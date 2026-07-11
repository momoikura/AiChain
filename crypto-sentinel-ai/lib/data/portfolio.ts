/** Deterministic demo portfolio, trades and rules. Paper-trading by default. */

import { Rng } from "@/lib/rng";
import type {
  Position,
  PortfolioStats,
  TradeRecord,
  TradingRule,
} from "@/lib/types";

export function getPortfolio(tick: number): {
  stats: PortfolioStats;
  positions: Position[];
  trades: TradeRecord[];
} {
  const rng = new Rng(`portfolio:${Math.floor(tick / 5)}`);

  const holdings: [string, string, number, number][] = [
    ["SOL", "Solana", 120, 141.2],
    ["JUP", "Jupiter", 18000, 0.86],
    ["ARB", "Arbitrum", 14000, 0.79],
    ["ENA", "Ethena", 9000, 0.71],
    ["INJ", "Injective", 240, 18.9],
  ];

  const positions: Position[] = holdings.map(([symbol, name, qty, avgEntry]) => {
    const price = avgEntry * (1 + rng.normal(0.06, 0.12));
    const value = qty * price;
    const unrealizedPnl = qty * (price - avgEntry);
    return {
      symbol,
      name,
      qty,
      avgEntry,
      price,
      allocationPct: 0,
      unrealizedPnl,
      unrealizedPnlPct: ((price - avgEntry) / avgEntry) * 100,
    };
  });

  const totalValue = positions.reduce((a, p) => a + p.qty * p.price, 0) + 42_000; // + stables
  positions.forEach((p) => (p.allocationPct = ((p.qty * p.price) / totalValue) * 100));

  const equityCurve: number[] = [];
  let eq = totalValue * 0.72;
  for (let i = 0; i < 60; i++) {
    eq = eq * (1 + rng.normal(0.006, 0.02));
    equityCurve.push(eq);
  }
  equityCurve[equityCurve.length - 1] = totalValue;

  const totalPnl = totalValue - equityCurve[0];
  const stats: PortfolioStats = {
    totalValue,
    totalPnl,
    totalPnlPct: (totalPnl / equityCurve[0]) * 100,
    winRate: 61 + rng.float(-4, 6),
    sharpe: 1.8 + rng.float(-0.3, 0.6),
    maxDrawdown: -(9 + rng.float(0, 8)),
    aiWinRate: 67 + rng.float(-3, 6),
    equityCurve,
  };

  const trades = getTrades(tick);
  return { stats, positions, trades };
}

export function getTrades(tick: number): TradeRecord[] {
  const rng = new Rng(`trades:${Math.floor(tick / 3)}`);
  const now = 1_752_000_000_000 + tick * 60_000;
  const rows: Omit<TradeRecord, "id" | "timestamp">[] = [
    { symbol: "SOL", side: "buy", status: "executed", qty: 40, price: 138.2, pnl: 1240, ruleName: "Smart-money accumulation", reason: "Confidence 91 · outflows + whale accumulation + dev spike", paper: true },
    { symbol: "JUP", side: "buy", status: "executed", qty: 6000, price: 0.82, pnl: 640, ruleName: "Breakout confirmation", reason: "Confidence 88 · stablecoin inflows + relative strength", paper: true },
    { symbol: "TIA", side: "sell", status: "executed", qty: 300, price: 6.4, pnl: -210, ruleName: "Distribution exit", reason: "Confidence 74 · unlock + funding extreme + inflows", paper: true },
    { symbol: "LDO", side: "buy", status: "rejected", qty: 0, price: 1.55, ruleName: "Smart-money accumulation", reason: "Blocked — governance risk contradicts thesis", paper: true },
    { symbol: "WIF", side: "buy", status: "missed", qty: 0, price: 1.9, ruleName: "Breakout confirmation", reason: "Cooldown active — prior trade within 30m window", paper: true },
    { symbol: "ARB", side: "buy", status: "executed", qty: 5000, price: 0.77, pnl: 100, ruleName: "Smart-money accumulation", reason: "Confidence 90 · governance buyback + outflows", paper: true },
    { symbol: "SEI", side: "buy", status: "rejected", qty: 0, price: 0.44, ruleName: "Breakout confirmation", reason: "Blocked — liquidity below minimum threshold", paper: true },
  ];
  return rows.map((r, i) => ({
    ...r,
    id: `trade-${tick}-${i}`,
    timestamp: now - rng.int(5, 720) * 60_000,
  }));
}

export function getRules(): TradingRule[] {
  return [
    {
      id: "rule-accumulation",
      name: "Smart-money accumulation",
      enabled: true,
      mode: "paper",
      side: "buy",
      conditions: [
        { field: "confidence", op: ">", value: 90 },
        { field: "exchange-flow", op: "decreasing" },
        { field: "smart-money", op: "increasing" },
        { field: "funding-rate", op: "neutral" },
        { field: "liquidity", op: ">", value: 1_000_000 },
      ],
      risk: {
        maxPositionUsd: 5000,
        dailyLossLimitUsd: 1500,
        takeProfitPct: 22,
        stopLossPct: 8,
        trailingStopPct: 6,
        cooldownMinutes: 30,
      },
      exchange: "Binance",
      lastTriggered: Date.now() - 42 * 60_000,
      triggerCount: 14,
    },
    {
      id: "rule-exit",
      name: "Distribution exit",
      enabled: true,
      mode: "manual-approval",
      side: "sell",
      conditions: [
        { field: "confidence", op: ">", value: 90 },
        { field: "whale-action", op: "decreasing" },
        { field: "exchange-flow", op: "increasing" },
        { field: "governance", op: "==", value: "negative" },
      ],
      risk: {
        maxPositionUsd: 8000,
        dailyLossLimitUsd: 2000,
        takeProfitPct: 0,
        stopLossPct: 0,
        trailingStopPct: 0,
        cooldownMinutes: 20,
      },
      exchange: "Bybit",
      lastTriggered: Date.now() - 190 * 60_000,
      triggerCount: 6,
    },
    {
      id: "rule-breakout",
      name: "Breakout confirmation",
      enabled: false,
      mode: "paper",
      side: "buy",
      conditions: [
        { field: "confidence", op: ">", value: 84 },
        { field: "smart-money", op: "increasing" },
        { field: "liquidity", op: ">", value: 2_000_000 },
      ],
      risk: {
        maxPositionUsd: 3000,
        dailyLossLimitUsd: 1000,
        takeProfitPct: 30,
        stopLossPct: 10,
        trailingStopPct: 8,
        cooldownMinutes: 45,
      },
      exchange: "OKX",
      triggerCount: 0,
    },
  ];
}
