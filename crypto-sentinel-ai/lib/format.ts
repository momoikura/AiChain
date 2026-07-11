/** Display formatting helpers. */

export function fmtUsd(n: number, opts: { compact?: boolean; dp?: number } = {}): string {
  const { compact = false, dp } = opts;
  if (compact) {
    return "$" + fmtCompact(n);
  }
  const digits = dp ?? (n < 1 ? 4 : 2);
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return sign + (abs / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return sign + (abs / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + "K";
  return sign + abs.toFixed(0);
}

/** Price formatting that adapts decimals to magnitude (for sub-cent memes). */
export function fmtPrice(n: number): string {
  if (n === 0) return "$0";
  const abs = Math.abs(n);
  let dp: number;
  if (abs >= 1) dp = 2;
  else if (abs >= 0.01) dp = 4;
  else if (abs >= 0.0001) dp = 6;
  else dp = 8;
  return (
    "$" +
    n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })
  );
}

export function fmtPct(n: number, dp = 2): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(dp)}%`;
}

export function fmtNum(n: number, dp = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function timeAgo(ts: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function classNames(...xs: (string | false | null | undefined)[]): string {
  return xs.filter(Boolean).join(" ");
}
