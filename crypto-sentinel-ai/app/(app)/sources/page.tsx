import { SOURCES, CATEGORY_LABEL } from "@/lib/sources/registry";
import { IcShield } from "@/components/brand/icons";

import { GlassCard, SectionTitle } from "@/components/ui/primitives";
import type { DataSource, SourceCategory } from "@/lib/types";
import { classNames } from "@/lib/format";
const COST_META: Record<DataSource["cost"], { label: string; cls: string }> = {
  free: { label: "Free", cls: "border-signal-green/30 bg-signal-green/10 text-signal-green" },
  freemium: { label: "Freemium", cls: "border-signal-yellow/30 bg-signal-yellow/10 text-signal-yellow" },
  paid: { label: "Paid", cls: "border-white/15 bg-white/5 text-white/45" },
};

const ORDER: SourceCategory[] = [
  "on-chain",
  "market",
  "analytics",
  "defi",
  "developer",
  "governance",
  "news",
  "social",
];

export default function Page() {
  const byCat = ORDER.map((cat) => ({
    cat,
    items: SOURCES.filter((s) => s.category === cat),
  }));

  const freeCount = SOURCES.filter((s) => s.cost === "free").length;
  const freemiumCount = SOURCES.filter((s) => s.cost === "freemium").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Data Sources</h1>
        <p className="mt-1 text-sm text-white/50">
          {SOURCES.length} providers across 8 categories, each behind a live-ready adapter. Sources
          shown as <span className="text-signal-blue">Simulated</span> flip to{" "}
          <span className="text-signal-green">Live</span> once configured — the engine and UI need no
          changes.
        </p>
      </div>

      {/* Zero-cost guarantee banner */}
      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl border border-signal-green/25 bg-signal-green/5 p-4">
        <IcShield className="h-6 w-6 shrink-0 text-signal-green" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">Runs at $0 — no paid API required</div>
          <p className="text-[12px] leading-relaxed text-white/50">
            The app runs entirely on the built-in simulated feed for free. To wire{" "}
            <span className="text-signal-green">real</span> live data at no cost, use the{" "}
            <span className="text-signal-green">{freeCount} free</span> keyless/public sources (plus{" "}
            <span className="text-signal-yellow">{freemiumCount} freemium</span> tiers). The{" "}
            <span className="text-white/70">Paid</span> providers (Nansen, Glassnode…) are optional —
            everything works without them.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total sources" value={String(SOURCES.length)} />
        <Stat label="Free to run live" value={String(freeCount)} />
        <Stat label="Freemium tiers" value={String(freemiumCount)} />
        <Stat label="Cost to you" value="$0" />
      </div>

      {byCat.map(({ cat, items }) => (
        <div key={cat} className="space-y-3">
          <SectionTitle title={CATEGORY_LABEL[cat]} subtitle={`${items.length} providers`} />
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((s) => (
              <GlassCard key={s.id} className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-white/90">{s.name}</span>
                  <span
                    className={classNames(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      COST_META[s.cost].cls
                    )}
                  >
                    {COST_META[s.cost].label}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-signal-blue/80">
                    {s.live ? "Live" : "Simulated"}
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="mb-1 flex items-center justify-between text-[10px] text-white/40">
                    <span>Reliability</span>
                    <span className="tabular font-semibold text-white/70">{s.reliability}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-signal-green to-accent-cyan"
                      style={{ width: `${s.reliability}%` }}
                    />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{label}</div>
      <div className="mt-1.5 tabular text-2xl font-bold text-white">{value}</div>
    </GlassCard>
  );
}
