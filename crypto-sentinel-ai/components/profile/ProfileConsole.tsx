"use client";

import { useMemo } from "react";
import {
  IcShield,
  IcBiometric,
  IcAutomation,
  IcSignals,
  IcPulse,
  IcLock,
  IcBolt,
  IcKey,
} from "@/components/brand/icons";
import { Rng, hashSeed } from "@/lib/rng";
import { classNames, timeAgo } from "@/lib/format";
import { GlassCard, SectionTitle, Chip } from "@/components/ui/primitives";
import { ConfidenceRing } from "@/components/ui/charts";
import { ScrambleText } from "@/components/fx/ScrambleText";
import { CountUp } from "@/components/fx/CountUp";

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "OP";
}

function hex(n: number, len: number): string {
  return (n >>> 0).toString(16).toUpperCase().padStart(len, "0").slice(0, len);
}

const RANKS = [
  { min: 0, label: "Field Recruit" },
  { min: 55, label: "Field Analyst" },
  { min: 70, label: "Senior Analyst" },
  { min: 82, label: "Intelligence Operative" },
  { min: 92, label: "Command · Sentinel-1" },
];

/** Holographic operator avatar — rotating reticle rings, scan, glowing core. */
function AvatarHologram({ label }: { label: string }) {
  return (
    <div className="relative h-24 w-24 shrink-0 animate-floatY">
      <span className="absolute inset-0 animate-spinSlow rounded-full border border-signal-green/40" />
      <span className="absolute inset-2 rounded-full border border-dashed border-accent-cyan/40" style={{ animation: "spinSlow 26s linear infinite reverse" }} />
      <span className="absolute inset-4 rounded-full bg-gradient-to-br from-signal-green/25 to-accent-cyan/15 shadow-glow backdrop-blur" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="phosphor text-2xl font-bold tracking-widest">{label}</span>
      </span>
      <span className="pointer-events-none absolute inset-4 overflow-hidden rounded-full">
        <span className="absolute inset-x-0 top-0 h-1/2 animate-scanline bg-gradient-to-b from-signal-green/30 to-transparent" />
      </span>
    </div>
  );
}

function Vital({ icon, label, value, tone = "text-signal-green" }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone?: string }) {
  return (
    <GlassCard hover className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</span>
        <span className={tone}>{icon}</span>
      </div>
      <div className={classNames("mt-2 tabular text-lg font-bold", tone)}>{value}</div>
    </GlassCard>
  );
}

export function ProfileConsole({ name, email }: { name: string; email: string }) {
  const d = useMemo(() => {
    const seed = hashSeed(email);
    const rng = new Rng(seed);
    const security = 74 + rng.int(0, 24);
    const rank = [...RANKS].reverse().find((r) => security >= r.min)!;
    const now = 1_752_000_000_000;
    return {
      operatorId: `SNTL-${hex(seed, 4)}-${hex(seed * 7 + 13, 4)}`,
      clearance: security >= 90 ? "LEVEL 5 · OMEGA" : security >= 80 ? "LEVEL 4 · CLASSIFIED" : "LEVEL 3 · RESTRICTED",
      rank: rank.label,
      security,
      integrity: 96 + rng.int(0, 3),
      memberDays: rng.int(38, 420),
      signalsReviewed: rng.int(1400, 9800),
      alertsActed: rng.int(120, 640),
      rejected: rng.int(20, 180),
      winRate: 58 + rng.int(0, 18),
      aiQueries: rng.int(3200, 24000),
      exchanges: [
        { name: "Binance", ok: rng.bool(0.6) },
        { name: "Bybit", ok: rng.bool(0.5) },
        { name: "OKX", ok: rng.bool(0.35) },
        { name: "Coinbase", ok: rng.bool(0.4) },
      ],
      timeline: [
        { t: "Acknowledged RED alert · SUI distribution", ago: 6 },
        { t: "Adjusted rule · Smart-money accumulation", ago: 42 },
        { t: "Opened dossier · WIF", ago: 88 },
        { t: "Emergency stop toggled", ago: 210 },
        { t: "Connected exchange key · Bybit", ago: 640 },
        { t: "Login · secure uplink established", ago: 1440 },
      ].map((x) => ({ ...x, ts: now - x.ago * 60_000 })),
      now,
    };
  }, [email]);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.25em] text-signal-green/50">
          <span className="text-signal-green/30">operator@sentinel</span>:~/identity$
        </div>
        <ScrambleText as="h1" text="CYBER IDENTITY CONSOLE" className="phosphor text-2xl font-bold tracking-tight sm:text-3xl" />
      </div>

      {/* Dossier header */}
      <GlassCard className="hud relative overflow-hidden p-5">
        <div className="pointer-events-none absolute inset-0 bg-grid-faint" style={{ backgroundSize: "26px 26px", opacity: 0.4, maskImage: "radial-gradient(ellipse at 20% 0%, black, transparent 70%)" }} />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <AvatarHologram label={initials(name)} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-white">{name}</h2>
              <span className="flex items-center gap-1 rounded-full border border-signal-green/30 bg-signal-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-signal-green">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal-green" /> online
              </span>
            </div>
            <div className="mt-1 font-mono text-[12px] text-white/45">{email}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip tone="green">◆ {d.operatorId}</Chip>
              <Chip tone="yellow">★ {d.rank}</Chip>
              <Chip tone="blue">⬡ {d.clearance}</Chip>
            </div>
          </div>
          <div className="shrink-0 self-center">
            <ConfidenceRing score={d.security} level={d.security >= 90 ? "green" : d.security >= 80 ? "yellow" : "green"} size={100} label="SECURITY" />
          </div>
        </div>
      </GlassCard>

      {/* Vitals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Vital icon={<IcShield className="h-4 w-4" />} label="Integrity" value={<><CountUp value={d.integrity} />%</>} />
        <Vital icon={<IcSignals className="h-4 w-4" />} label="Threat Det." value="ACTIVE" />
        <Vital icon={<IcBiometric className="h-4 w-4" />} label="Biometric" value="VERIFIED" tone="text-signal-blue" />
        <Vital icon={<IcLock className="h-4 w-4" />} label="2FA" value="ENABLED" tone="text-signal-blue" />
        <Vital icon={<IcAutomation className="h-4 w-4" />} label="AI Queries" value={<CountUp value={d.aiQueries} />} tone="text-signal-yellow" />
        <Vital icon={<IcPulse className="h-4 w-4" />} label="Active" value={<><CountUp value={d.memberDays} />d</>} tone="text-signal-violet" />
      </div>

      {/* Mission stats + Access */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <GlassCard className="p-5">
          <SectionTitle title="Mission Statistics" subtitle="Operator intelligence record" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Signals reviewed", d.signalsReviewed, "text-signal-green"],
              ["Alerts acted", d.alertsActed, "text-signal-green"],
              ["Alerts rejected", d.rejected, "text-signal-red"],
              ["Win rate", d.winRate, "text-signal-yellow"],
            ].map(([label, val, tone]) => (
              <div key={label as string} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <div className="text-[10px] uppercase tracking-widest text-white/40">{label as string}</div>
                <div className={classNames("tabular mt-1 text-xl font-bold", tone as string)}>
                  <CountUp value={val as number} />
                  {label === "Win rate" ? "%" : ""}
                </div>
              </div>
            ))}
            <div className="col-span-2 flex items-center gap-3 rounded-xl border border-signal-green/15 bg-signal-green/5 p-3 sm:col-span-1">
              <IcBolt className="h-5 w-5 text-signal-green" />
              <div className="text-[11px] leading-snug text-white/60">Engine attribution nominal · no anomalies</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Access & Security" subtitle="Connected systems" />
          <div className="mt-4 space-y-2">
            {d.exchanges.map((e) => (
              <div key={e.name} className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-white/80">
                  <IcKey className="h-3.5 w-3.5 text-white/40" /> {e.name}
                </span>
                <span className={classNames("text-[10px] font-bold uppercase tracking-wider", e.ok ? "text-signal-green" : "text-white/35")}>
                  {e.ok ? "● connected" : "○ not linked"}
                </span>
              </div>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-white/45">
              {["API status", "Session", "Wallet sec.", "Audit log"].map((f) => (
                <div key={f} className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-2">
                  <IcLock className="h-3 w-3 text-signal-green" /> {f}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Activity timeline */}
      <GlassCard className="p-5">
        <SectionTitle title="Activity Timeline" subtitle="Recent operator actions · audit trail" />
        <ol className="mt-4 space-y-0">
          {d.timeline.map((row, i) => (
            <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-signal-green shadow-glow" />
                {i < d.timeline.length - 1 && <span className="w-px flex-1 bg-signal-green/20" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <IcPulse className="h-3.5 w-3.5 shrink-0 text-signal-green/60" />
                  <span className="truncate text-[13px] text-white/75">{row.t}</span>
                </div>
                <span className="font-mono text-[11px] text-white/35">{timeAgo(row.ts, d.now)}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-2 border-t border-white/8 pt-3 text-[11px] leading-relaxed text-white/30">
          Classified operator dossier · probabilistic, evidence-based intelligence — not financial advice.
        </p>
      </GlassCard>
    </div>
  );
}
