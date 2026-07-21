import { fetchNews, taggedAssets } from "@/lib/news/rss";
import { GlassCard, SectionTitle, Chip } from "@/components/ui/primitives";
import { ScrambleText } from "@/components/fx/ScrambleText";
import { IcArrowUpRight, IcClock, IcNews } from "@/components/brand/icons";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 300;

const SOURCE_TONE: Record<string, string> = {
  CoinDesk: "text-signal-green",
  Cointelegraph: "text-accent-cyan",
  Decrypt: "text-signal-violet",
};

export default async function NewsPage() {
  const { items, stale } = await fetchNews(40);
  const now = Date.now();
  const sources = Array.from(new Set(items.map((i) => i.source)));

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.25em] text-signal-green/50">
          <span className="text-signal-green/30">operator@sentinel</span>:~/news-intel$
        </div>
        <ScrambleText
          as="h1"
          text="NEWS INTELLIGENCE"
          className="phosphor text-2xl font-bold tracking-tight sm:text-3xl"
        />
        <p className="mt-1.5 font-mono text-sm text-signal-green/45">
          <span className="text-signal-green/70">&gt;</span> live headlines from{" "}
          {sources.join(" · ") || "—"} · de-duplicated · newest first
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
            <span className="text-signal-green"><IcNews size={15} /></span> Headlines
          </div>
          <div className="mt-1.5 tabular text-2xl font-bold text-white">{items.length}</div>
          <div className="text-[11px] text-white/40">last 5 min cache</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
            <span className="text-accent-cyan"><IcNews size={15} /></span> Sources
          </div>
          <div className="mt-1.5 tabular text-2xl font-bold text-white">{sources.length}</div>
          <div className="text-[11px] text-white/40">keyless RSS · $0</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
            <span className={stale ? "text-signal-red" : "text-signal-green"}><IcClock size={15} /></span> Feed
          </div>
          <div className={`mt-1.5 text-2xl font-bold ${stale ? "text-signal-red" : "text-signal-green"}`}>
            {stale ? "STALE" : "LIVE"}
          </div>
          <div className="text-[11px] text-white/40">
            {items[0] ? `latest ${timeAgo(items[0].publishedAt, now)}` : "—"}
          </div>
        </GlassCard>
      </div>

      <div className="space-y-3">
        <SectionTitle
          title="Wire"
          subtitle="Headlines are evidence — the engine still requires multi-source corroboration"
        />
        {items.length === 0 ? (
          <GlassCard className="p-8 text-center text-sm text-white/50">
            No headlines available right now — the upstream feeds didn&apos;t respond.
          </GlassCard>
        ) : (
          <div className="space-y-2.5">
            {items.map((n) => {
              const assets = taggedAssets(`${n.title} ${n.summary}`);
              return (
                <a
                  key={n.id}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass glass-hover block rounded-2xl p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className={`font-mono font-semibold uppercase tracking-wider ${SOURCE_TONE[n.source] ?? "text-white/60"}`}>
                      {n.source}
                    </span>
                    <span className="text-white/30">
                      <IcClock size={11} className="mr-1 inline align-[-1px]" />
                      {timeAgo(n.publishedAt, now)}
                    </span>
                    {assets.slice(0, 4).map((a) => (
                      <Chip key={a} tone="green">{a}</Chip>
                    ))}
                    <span className="ml-auto text-signal-green/50">
                      <IcArrowUpRight size={14} />
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-white">
                    {n.title}
                  </h3>
                  {n.summary && (
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-white/45">
                      {n.summary}
                    </p>
                  )}
                </a>
              );
            })}
          </div>
        )}
        <p className="text-[11px] leading-relaxed text-white/30">
          Aggregated from public RSS feeds. Headlines are inputs to the scoring engine, never a
          standalone trade signal — news alone can never trigger an alert.
        </p>
      </div>
    </div>
  );
}
