import { NetworkGraph3D } from "@/components/three/NetworkGraph3D";
import { SplitReveal } from "@/components/fx/SplitReveal";
import { GlassCard } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

const LEGEND = [
  { label: "Token hub", color: "#00ff41" },
  { label: "Smart money", color: "#22d3ff" },
  { label: "Whale", color: "#b26bff" },
  { label: "VC", color: "#ffcf3a" },
  { label: "Exchange", color: "#ff2957" },
  { label: "Team / insider", color: "#00ffe0" },
];

export default function NetworkPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.25em] text-signal-green/50">
          <span className="text-signal-green/30">operator@sentinel</span>:~/network-map$
        </div>
        <SplitReveal
          as="h1"
          text="WALLET CONSTELLATION"
          className="phosphor text-2xl font-bold tracking-tight sm:text-3xl"
        />
        <p className="mt-1.5 font-mono text-sm text-signal-green/45">
          <span className="text-signal-green/70">&gt;</span> on-chain clustering rendered in
          space — wallets, relationships &amp; net flows across the tracked universe
        </p>
      </div>

      {/* 3D constellation stage */}
      <div className="glass hud relative h-[62vh] min-h-[420px] overflow-hidden rounded-2xl">
        <NetworkGraph3D className="absolute inset-0" />

        {/* HUD readouts */}
        <div className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] uppercase tracking-widest text-signal-green/50">
          <div>◢ cluster.render // live</div>
          <div className="text-signal-green/30">nodes · edges · net-flow</div>
        </div>
        <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-signal-green/50">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal-green" /> rotating · drag-parallax
        </div>

        {/* Legend */}
        <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-x-3 gap-y-1">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-white/60">
              <span className="h-2 w-2 rounded-full" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Context */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Clustering", "Wallets grouped by funding, behaviour and label so related actors read as one entity."],
          ["Net flow", "Edge direction & weight encode value moving toward or away from each token hub."],
          ["Corroboration", "Constellation shifts feed the engine — but never trigger an alert on their own."],
        ].map(([t, d]) => (
          <GlassCard key={t} className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-signal-green/70">{t}</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/55">{d}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
