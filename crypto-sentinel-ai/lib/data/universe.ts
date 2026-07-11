/**
 * Simulated intelligence feed.
 *
 * Produces a stable-but-organic universe of tokens and the raw Signals that
 * the detectors/engine consume. Deterministic per `tick` so server and client
 * agree (no hydration mismatch) while still evolving over time.
 *
 * In production these come from `SourceAdapter.poll()` across the registry.
 */

import { Rng } from "@/lib/rng";
import { SOURCES } from "@/lib/sources/registry";
import type {
  Chain,
  Signal,
  SignalKind,
  SignalPolarity,
  SourceCategory,
  Token,
  TokenSector,
} from "@/lib/types";

interface Seed {
  symbol: string;
  name: string;
  chain: Chain;
  sector: TokenSector;
  basePrice: number;
  baseMcap: number;
  /** bullishBias in [-1,1] steers the mix of signals for a compelling demo. */
  bias: number;
}

const SEEDS: Seed[] = [
  // Majors / L1s / L2s / DeFi / infra
  { symbol: "SOL", name: "Solana", chain: "solana", sector: "l1", basePrice: 182.4, baseMcap: 86e9, bias: 0.7 },
  { symbol: "ARB", name: "Arbitrum", chain: "arbitrum", sector: "l2", basePrice: 0.92, baseMcap: 3.6e9, bias: 0.55 },
  { symbol: "JUP", name: "Jupiter", chain: "solana", sector: "defi", basePrice: 1.14, baseMcap: 3.1e9, bias: 0.82 },
  { symbol: "ENA", name: "Ethena", chain: "ethereum", sector: "defi", basePrice: 0.78, baseMcap: 2.3e9, bias: 0.4 },
  { symbol: "TIA", name: "Celestia", chain: "ethereum", sector: "infra", basePrice: 6.2, baseMcap: 1.4e9, bias: -0.35 },
  { symbol: "SEI", name: "Sei", chain: "ethereum", sector: "l1", basePrice: 0.44, baseMcap: 1.9e9, bias: 0.62 },
  { symbol: "PYTH", name: "Pyth Network", chain: "solana", sector: "oracle", basePrice: 0.38, baseMcap: 1.4e9, bias: 0.48 },
  { symbol: "OP", name: "Optimism", chain: "base", sector: "l2", basePrice: 1.72, baseMcap: 2.5e9, bias: 0.2 },
  { symbol: "INJ", name: "Injective", chain: "ethereum", sector: "l1", basePrice: 21.6, baseMcap: 2.1e9, bias: 0.3 },
  { symbol: "AAVE", name: "Aave", chain: "ethereum", sector: "defi", basePrice: 142.0, baseMcap: 2.1e9, bias: 0.15 },
  { symbol: "LDO", name: "Lido DAO", chain: "ethereum", sector: "defi", basePrice: 1.55, baseMcap: 1.4e9, bias: -0.6 },
  { symbol: "SUI", name: "Sui", chain: "ethereum", sector: "l1", basePrice: 1.02, baseMcap: 2.8e9, bias: -0.5 },

  // Meme coins — high volatility, socially-driven, mixed conviction
  { symbol: "WIF", name: "dogwifhat", chain: "solana", sector: "meme", basePrice: 2.35, baseMcap: 2.3e9, bias: 0.9 },
  { symbol: "PEPE", name: "Pepe", chain: "ethereum", sector: "meme", basePrice: 0.0000108, baseMcap: 4.5e9, bias: 0.75 },
  { symbol: "BONK", name: "Bonk", chain: "solana", sector: "meme", basePrice: 0.0000242, baseMcap: 1.7e9, bias: 0.86 },
  { symbol: "POPCAT", name: "Popcat", chain: "solana", sector: "meme", basePrice: 1.42, baseMcap: 1.4e9, bias: 0.94 },
  { symbol: "BRETT", name: "Brett", chain: "base", sector: "meme", basePrice: 0.089, baseMcap: 0.88e9, bias: 0.68 },
  { symbol: "MEW", name: "cat in a dogs world", chain: "solana", sector: "meme", basePrice: 0.0071, baseMcap: 0.63e9, bias: 0.55 },
  { symbol: "FLOKI", name: "Floki", chain: "bsc", sector: "meme", basePrice: 0.00016, baseMcap: 1.5e9, bias: 0.32 },
  { symbol: "SHIB", name: "Shiba Inu", chain: "ethereum", sector: "meme", basePrice: 0.0000172, baseMcap: 10.1e9, bias: -0.28 },
  { symbol: "TURBO", name: "Turbo", chain: "ethereum", sector: "meme", basePrice: 0.0058, baseMcap: 0.4e9, bias: -0.55 },
  { symbol: "MOG", name: "Mog Coin", chain: "ethereum", sector: "meme", basePrice: 0.0000019, baseMcap: 0.74e9, bias: 0.6 },
];

// Signal templates keyed by kind → how to render + inherent polarity.
// `scope: "meme"` marks meme-native detectors that only fire on meme tokens.
const SIGNAL_TEMPLATES: Record<
  SignalKind,
  { polarity: SignalPolarity; cat: SourceCategory; label: string; scope?: "meme"; make: (t: string, r: Rng) => string }
> = {
  "whale-accumulation": { polarity: "bullish", cat: "on-chain", label: "Whale accumulation", make: (t, r) => `${r.int(3, 9)} whale wallets added ${r.int(2, 14)}M ${t} over 48h` },
  "whale-distribution": { polarity: "bearish", cat: "on-chain", label: "Whale distribution", make: (t, r) => `Top holder moved ${r.int(4, 20)}M ${t} to exchanges` },
  "exchange-outflow": { polarity: "bullish", cat: "on-chain", label: "Exchange outflows", make: (t, r) => `Net ${r.int(5, 40)}M ${t} withdrawn from CEX wallets (7d)` },
  "exchange-inflow": { polarity: "bearish", cat: "on-chain", label: "Exchange inflows", make: (t, r) => `Net ${r.int(5, 35)}M ${t} deposited to CEX wallets (7d)` },
  "liquidity-add": { polarity: "bullish", cat: "defi", label: "Liquidity added", make: (t, r) => `+$${r.int(2, 18)}M liquidity added to ${t} pools` },
  "liquidity-remove": { polarity: "bearish", cat: "defi", label: "Liquidity pulled", make: (t, r) => `-$${r.int(2, 12)}M liquidity removed from ${t} pools` },
  "listing-rumor": { polarity: "bullish", cat: "social", label: "Listing rumor", make: (t) => `Unconfirmed chatter of a major CEX listing for ${t}` },
  "listing-confirmed": { polarity: "bullish", cat: "news", label: "Listing confirmed", make: (t, r) => `Tier-1 exchange confirms ${t} spot listing ${r.pick(["today", "this week"])}` },
  "vc-accumulation": { polarity: "bullish", cat: "on-chain", label: "VC accumulation", make: (t, r) => `Labeled VC wallets accumulated ${r.int(1, 6)}M ${t}` },
  "treasury-movement": { polarity: "neutral", cat: "governance", label: "Treasury movement", make: (t, r) => `DAO treasury moved ${r.int(1, 9)}M ${t} to a new multisig` },
  "insider-activity": { polarity: "bullish", cat: "on-chain", label: "Insider wallet activity", make: (t, r) => `Team-linked wallet re-accumulated ${r.int(1, 4)}M ${t}` },
  "token-unlock": { polarity: "bearish", cat: "market", label: "Upcoming unlock", make: (t, r) => `${r.int(2, 8)}% supply unlock for ${t} in ${r.int(2, 21)}d` },
  "large-burn": { polarity: "bullish", cat: "on-chain", label: "Large burn", make: (t, r) => `${r.int(1, 5)}M ${t} burned, reducing supply` },
  "large-mint": { polarity: "bearish", cat: "on-chain", label: "Large mint", make: (t, r) => `${r.int(2, 10)}M new ${t} minted to treasury` },
  "bridge-activity": { polarity: "bullish", cat: "on-chain", label: "Bridge inflows", make: (t, r) => `${r.int(3, 15)}M ${t} bridged onto the network (24h)` },
  "protocol-launch": { polarity: "bullish", cat: "defi", label: "Protocol launch", make: (t) => `New flagship protocol launching on ${t} ecosystem` },
  partnership: { polarity: "bullish", cat: "news", label: "Partnership", make: (t) => `${t} announces integration with a major infra partner` },
  "governance-approved": { polarity: "bullish", cat: "governance", label: "Governance approved", make: (t, r) => `Proposal to ${r.pick(["enable buybacks", "fund grants", "reduce emissions"])} passed` },
  "governance-negative": { polarity: "bearish", cat: "governance", label: "Governance risk", make: (t) => `Contentious emissions-increase proposal gaining votes` },
  "dev-activity-spike": { polarity: "bullish", cat: "developer", label: "Dev activity spike", make: (t, r) => `GitHub commits up ${r.int(40, 220)}% w/w, ${r.int(2, 9)} new contributors` },
  "options-anomaly": { polarity: "neutral", cat: "market", label: "Options positioning", make: (t, r) => `Unusual ${r.pick(["call", "put"])} skew building on ${t} options` },
  "funding-extreme": { polarity: "bearish", cat: "market", label: "Funding extreme", make: (t, r) => `Perp funding at ${r.float(0.08, 0.3).toFixed(2)}% — crowded longs` },
  "liquidation-cascade": { polarity: "bearish", cat: "market", label: "Liquidation cascade", make: (t, r) => `$${r.int(4, 40)}M ${t} longs liquidated in 1h` },
  "momentum-divergence": { polarity: "neutral", cat: "analytics", label: "Momentum divergence", make: (t) => `Price/OI divergence forming on ${t}` },
  "relative-strength": { polarity: "bullish", cat: "analytics", label: "Relative strength", make: (t, r) => `${t} outperforming majors by ${r.int(6, 22)}% (7d)` },
  "stablecoin-inflow": { polarity: "bullish", cat: "defi", label: "Stablecoin inflows", make: (t, r) => `$${r.int(10, 90)}M stablecoins flowed into ${t} ecosystem` },

  // --- meme-native detectors (only fire on meme tokens) ---
  "social-surge": { polarity: "bullish", cat: "social", scope: "meme", label: "Social surge", make: (t, r) => `${t} mentions +${r.int(120, 900)}% / 24h · engagement spiking on X & Telegram` },
  "influencer-post": { polarity: "bullish", cat: "social", scope: "meme", label: "Influencer / KOL post", make: (t, r) => `${r.int(2, 6)} verified KOLs (${r.int(50, 900)}k followers) posted about ${t}` },
  "holder-spike": { polarity: "bullish", cat: "on-chain", scope: "meme", label: "Holder growth spike", make: (t, r) => `Unique holders +${r.int(8, 45)}% / 24h — ${r.int(1, 12)}k new wallets` },
  "smart-money-ape": { polarity: "bullish", cat: "on-chain", scope: "meme", label: "Smart money aping", make: (t, r) => `${r.int(3, 14)} profitable memecoin wallets bought ${t} in the last hour` },
  "volume-surge": { polarity: "bullish", cat: "market", scope: "meme", label: "Volume surge", make: (t, r) => `DEX volume +${r.int(60, 500)}% / 24h — momentum building on ${t}` },
  "lp-locked": { polarity: "bullish", cat: "on-chain", scope: "meme", label: "Liquidity locked", make: (t, r) => `${t} LP locked for ${r.int(3, 24)} months — rug risk reduced` },
  "pumpfun-graduation": { polarity: "bullish", cat: "on-chain", scope: "meme", label: "Bonding-curve graduation", make: (t, r) => `${t} graduated to Raydium with $${r.int(60, 400)}k liquidity` },
  "sniper-cluster": { polarity: "bearish", cat: "on-chain", scope: "meme", label: "Sniper cluster", make: (t, r) => `${r.int(4, 22)} sniper wallets hold ${r.int(12, 38)}% of ${t} supply — dump risk` },
  "supply-concentration": { polarity: "bearish", cat: "on-chain", scope: "meme", label: "Supply concentration", make: (t, r) => `Top 10 wallets control ${r.int(35, 68)}% of ${t} — high concentration risk` },
};

const kindsBy = (polarity: SignalPolarity, memeScope: boolean) =>
  Object.entries(SIGNAL_TEMPLATES)
    .filter(([, v]) => v.polarity === polarity && (memeScope ? true : v.scope !== "meme"))
    .map(([k]) => k as SignalKind);

// General pools exclude meme-native detectors; meme pools include them.
const BULLISH_KINDS = kindsBy("bullish", false);
const BEARISH_KINDS = kindsBy("bearish", false);
const NEUTRAL_KINDS = kindsBy("neutral", false);
const MEME_BULLISH_KINDS = kindsBy("bullish", true);
const MEME_BEARISH_KINDS = kindsBy("bearish", true);
// Meme-native kinds only, for guaranteeing meme flavor on meme tokens.
const MEME_ONLY_KINDS = Object.entries(SIGNAL_TEMPLATES)
  .filter(([, v]) => v.scope === "meme")
  .map(([k]) => k as SignalKind);

function sourcesForCategory(cat: SourceCategory) {
  return SOURCES.filter((s) => s.category === cat);
}

/** Build the full set of raw signals for one token at a given tick. */
export function generateSignals(seed: Seed, tick: number): Signal[] {
  const rng = new Rng(`${seed.symbol}:${tick}`);
  const signals: Signal[] = [];
  const now = 1_752_000_000_000 + tick * 60_000; // stable base clock

  const isMeme = seed.sector === "meme";
  // Number of signals scales with |bias| for a livelier demo — stronger
  // conviction setups accumulate more corroborating evidence.
  const count = rng.int(6, 9) + Math.round(Math.abs(seed.bias) * 3);
  const bullP = 0.5 + seed.bias * 0.42; // bias steers polarity mix

  // Pools: meme tokens draw from meme-native detectors too.
  const bullPool = isMeme ? MEME_BULLISH_KINDS : BULLISH_KINDS;
  const bearPool = isMeme ? MEME_BEARISH_KINDS : BEARISH_KINDS;

  for (let i = 0; i < count; i++) {
    const roll = rng.float();
    let kind: SignalKind;
    // On meme tokens, bias a share of picks toward meme-native detectors so
    // the meme flavor (social surge, snipers, LP locks…) is always present.
    if (isMeme && rng.bool(0.55)) {
      const memePicks = roll < bullP
        ? MEME_ONLY_KINDS.filter((k) => SIGNAL_TEMPLATES[k].polarity === "bullish")
        : MEME_ONLY_KINDS.filter((k) => SIGNAL_TEMPLATES[k].polarity === "bearish");
      kind = memePicks.length ? rng.pick(memePicks) : rng.pick(bullPool);
    } else if (roll < bullP) kind = rng.pick(bullPool);
    else if (roll < bullP + (1 - bullP) * 0.75) kind = rng.pick(bearPool);
    else kind = rng.pick(NEUTRAL_KINDS);

    const tpl = SIGNAL_TEMPLATES[kind];
    const candidates = sourcesForCategory(tpl.cat);
    const src = candidates.length ? rng.pick(candidates) : rng.pick(SOURCES);
    const anomalyZ = Math.abs(rng.normal(2.5, 0.9));
    const onChainConfirmed = tpl.cat === "on-chain" ? true : rng.bool(0.4);

    signals.push({
      id: `${seed.symbol}-${tick}-${i}`,
      tokenSymbol: seed.symbol,
      kind,
      polarity: tpl.polarity,
      strength: Math.round(rng.float(55, 99)),
      reliability: src.reliability,
      anomalyZ: Number(anomalyZ.toFixed(2)),
      sourceId: src.id,
      sourceName: src.name,
      category: tpl.cat,
      headline: tpl.label,
      detail: tpl.make(seed.symbol, rng),
      timestamp: now - rng.int(0, 42) * 60_000,
      onChainConfirmed,
    });
  }
  return signals.sort((a, b) => b.timestamp - a.timestamp);
}

function buildSpark(seed: Seed, tick: number): number[] {
  const rng = new Rng(`${seed.symbol}:spark:${Math.floor(tick / 3)}`);
  const out: number[] = [];
  let p = seed.basePrice * (0.9 + rng.float(0, 0.1));
  // Meme coins move harder in both directions.
  const isMeme = seed.sector === "meme";
  const drift = seed.bias * (isMeme ? 0.007 : 0.004);
  const vol = isMeme ? 0.032 : 0.018;
  for (let i = 0; i < 48; i++) {
    p = p * (1 + drift + rng.normal(0, vol));
    out.push(p);
  }
  return out;
}

export function generateTokens(tick: number): { token: Token; signals: Signal[] }[] {
  return SEEDS.map((seed) => {
    const signals = generateSignals(seed, tick);
    const spark = buildSpark(seed, tick);
    const price = spark[spark.length - 1];
    const change24h = ((price - spark[spark.length - 24]) / spark[spark.length - 24]) * 100;
    const change7d = ((price - spark[0]) / spark[0]) * 100;
    const rng = new Rng(`${seed.symbol}:mkt:${tick}`);

    const token: Token = {
      symbol: seed.symbol,
      name: seed.name,
      chain: seed.chain,
      sector: seed.sector,
      isMeme: seed.sector === "meme",
      price,
      change24h,
      change7d,
      volume24h: seed.baseMcap * rng.float(0.05, 0.35),
      marketCap: seed.baseMcap * (price / seed.basePrice),
      fdv: seed.baseMcap * (price / seed.basePrice) * rng.float(1.1, 2.4),
      liquidity: seed.baseMcap * rng.float(0.01, 0.06),
      fundingRate: rng.normal(0.01, 0.05),
      openInterest: seed.baseMcap * rng.float(0.02, 0.12),
      circulatingSupply: seed.baseMcap / seed.basePrice,
      totalSupply: (seed.baseMcap / seed.basePrice) * rng.float(1.1, 2.2),
      spark,
      sentinelScore: 0, // filled by engine
      topLevel: "green",
    };
    return { token, signals };
  });
}
