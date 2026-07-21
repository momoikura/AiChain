/**
 * Real crypto news — keyless RSS aggregation ($0, no API key).
 *
 * Pulls CoinDesk / Cointelegraph / Decrypt in parallel, normalises to a common
 * shape, de-dupes near-identical headlines across outlets, and sorts newest
 * first. Cached server-side for 5 minutes. A single feed failing never breaks
 * the result — we just return what the others gave us.
 */

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: number;
  summary: string;
}

const FEEDS: { source: string; url: string }[] = [
  { source: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { source: "Cointelegraph", url: "https://cointelegraph.com/rss" },
  { source: "Decrypt", url: "https://decrypt.co/feed" },
];

/** Tokens we track — used to tag which asset a headline mentions. */
const TICKERS = [
  "SOL", "ARB", "JUP", "ENA", "TIA", "SEI", "PYTH", "OP", "INJ", "AAVE", "LDO",
  "SUI", "WIF", "PEPE", "BONK", "POPCAT", "BRETT", "MEW", "FLOKI", "SHIB",
  "TURBO", "MOG", "BTC", "ETH",
];
const NAME_HINTS: Record<string, string> = {
  solana: "SOL", arbitrum: "ARB", jupiter: "JUP", ethena: "ENA", celestia: "TIA",
  sei: "SEI", pyth: "PYTH", optimism: "OP", injective: "INJ", aave: "AAVE",
  lido: "LDO", sui: "SUI", dogwifhat: "WIF", pepe: "PEPE", bonk: "BONK",
  popcat: "POPCAT", brett: "BRETT", floki: "FLOKI", shiba: "SHIB",
  bitcoin: "BTC", ethereum: "ETH",
};

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "") // strip embedded HTML
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8216;|&lsquo;/g, "'")
    .replace(/&#8220;|&ldquo;|&#8221;|&rdquo;/g, '"')
    .replace(/&#8230;|&hellip;/g, "…")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function field(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decode(m[1]) : "";
}

/** Assets mentioned in a headline — powers the per-token news filter. */
export function taggedAssets(text: string): string[] {
  const upper = text.toUpperCase();
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const t of TICKERS) {
    if (new RegExp(`\\b${t}\\b`).test(upper)) found.add(t);
  }
  for (const [name, sym] of Object.entries(NAME_HINTS)) {
    if (lower.includes(name)) found.add(sym);
  }
  return [...found];
}

function parseFeed(xml: string, source: string): NewsItem[] {
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  const out: NewsItem[] = [];
  for (const raw of blocks) {
    const block = raw.split(/<\/item>/i)[0];
    const title = field(block, "title");
    const link = field(block, "link");
    if (!title || !link) continue;
    const pub = field(block, "pubDate") || field(block, "dc:date");
    const ts = pub ? Date.parse(pub) : NaN;
    out.push({
      id: `${source}:${link}`,
      title,
      url: link,
      source,
      publishedAt: Number.isNaN(ts) ? Date.now() : ts,
      summary: field(block, "description").slice(0, 240),
    });
  }
  return out;
}

let lastGood: NewsItem[] = [];

export async function fetchNews(limit = 40): Promise<{ items: NewsItem[]; stale: boolean }> {
  const results = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const res = await fetch(f.url, {
        next: { revalidate: 300 }, // 5 min cache
        headers: { accept: "application/rss+xml, application/xml, text/xml" },
      });
      if (!res.ok) throw new Error(`${f.source} ${res.status}`);
      return parseFeed(await res.text(), f.source);
    })
  );

  const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  if (!items.length) return { items: lastGood, stale: true };

  // De-dupe the same story reported by multiple outlets.
  const seen = new Set<string>();
  const deduped = items.filter((i) => {
    const key = i.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => b.publishedAt - a.publishedAt);
  lastGood = deduped.slice(0, limit);
  return { items: lastGood, stale: false };
}
