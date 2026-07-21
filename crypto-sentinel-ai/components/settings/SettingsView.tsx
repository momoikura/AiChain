"use client";

import { useState, useTransition } from "react";
import { IcArrowUpRight, IcBell, IcBiometric, IcCheck, IcKey, IcLock, IcMail, IcNetwork, IcShield, IcSocial, IcSpinner } from "@/components/brand/icons";

import { GlassCard, SectionTitle } from "@/components/ui/primitives";
import { classNames } from "@/lib/format";
import { saveNotificationsAction, saveExchangeKeyAction } from "@/app/(app)/settings/actions";
import { NotificationChannels } from "@/components/settings/NotificationChannels";

type Level = "green" | "yellow" | "red";

interface SettingsProps {
  initialSettings: { channels: Record<string, boolean>; minLevel: Level };
  initialKeys: { id: string; exchange: string; keyMask: string; permissions: string[] }[];
  persist: boolean;
}

function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button
      onClick={() => set(!on)}
      className={classNames(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        on ? "bg-signal-green/80" : "bg-white/15"
      )}
    >
      <span
        className={classNames(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
          on ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

const CHANNELS = [
  { key: "browser", label: "Browser push", icon: <IcBell className="h-4 w-4" /> },
  { key: "email", label: "Email", icon: <IcMail className="h-4 w-4" /> },
  { key: "telegram", label: "Telegram", icon: <IcArrowUpRight className="h-4 w-4" /> },
  { key: "discord", label: "Discord", icon: <IcSocial className="h-4 w-4" /> },
  { key: "slack", label: "Slack", icon: <IcSocial className="h-4 w-4" /> },
  { key: "webhook", label: "Webhook", icon: <IcNetwork className="h-4 w-4" /> },
];

const EXCHANGES = ["Binance", "Bybit", "OKX", "Coinbase Advanced"];

export function SettingsView({ initialSettings, initialKeys, persist }: SettingsProps) {
  const [channels, setChannels] = useState<Record<string, boolean>>(initialSettings.channels);
  const [twoFA, setTwoFA] = useState(true);
  const [minLevel, setMinLevel] = useState<Level>(initialSettings.minLevel);
  const [savingNotif, startNotif] = useTransition();
  const [notifSaved, setNotifSaved] = useState(false);

  function saveNotifications() {
    if (!persist) return;
    setNotifSaved(false);
    // Mirror the threshold locally so the browser notifier can read it without a round-trip.
    try {
      localStorage.setItem("sentinel_min_level", minLevel);
    } catch {}
    startNotif(async () => {
      await saveNotificationsAction({ channels, minLevel });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2500);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/50">
          Exchange connections, notifications and account security.
          {!persist && (
            <span className="ml-1 text-signal-yellow">
              Preview mode — connect Supabase to persist changes.
            </span>
          )}
        </p>
      </div>

      {/* Security */}
      <GlassCard className="p-5">
        <SectionTitle title="Security" subtitle="OWASP-aligned · encrypted secrets · audit-logged" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <div className="flex items-center gap-3">
              <IcBiometric className="h-5 w-5 text-signal-green" />
              <div>
                <div className="text-sm font-medium text-white/90">Two-factor authentication</div>
                <div className="text-[11px] text-white/40">TOTP · required for trade execution</div>
              </div>
            </div>
            <Toggle on={twoFA} set={setTwoFA} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <div className="flex items-center gap-3">
              <IcShield className="h-5 w-5 text-signal-green" />
              <div>
                <div className="text-sm font-medium text-white/90">Role-based access</div>
                <div className="text-[11px] text-white/40">Owner · Analyst · Viewer</div>
              </div>
            </div>
            <span className="rounded-md bg-signal-green/10 px-2 py-1 text-[10px] font-bold uppercase text-signal-green">
              Owner
            </span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/40 sm:grid-cols-4">
          {["Encrypted API keys", "Session management", "Rate limiting", "Audit logs"].map((f) => (
            <div
              key={f}
              className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-2"
            >
              <IcLock className="h-3 w-3 text-signal-green" /> {f}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Exchange keys */}
      <GlassCard className="p-5">
        <SectionTitle
          title="Exchange Connections"
          subtitle="Encrypted (AES-256-GCM) before storage · scoped permissions"
        />
        <div className="mt-4 space-y-2.5">
          {EXCHANGES.map((ex) => (
            <ExchangeRow
              key={ex}
              exchange={ex}
              connected={initialKeys.find((k) => k.exchange === ex)}
              persist={persist}
            />
          ))}
          <p className="text-[11px] text-white/35">
            Read-only keys are recommended for intelligence. Trade permission should be granted only
            for the exchanges you intend to automate, with IP allow-listing where supported.
          </p>
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard className="p-5">
        <SectionTitle
          title="Notifications"
          subtitle="Where alerts are delivered"
          right={
            <button
              onClick={saveNotifications}
              disabled={!persist || savingNotif}
              className={classNames(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                notifSaved
                  ? "border-signal-green/40 bg-signal-green/10 text-signal-green"
                  : "border-white/15 bg-white/[0.04] text-white/70 hover:text-white",
                (!persist || savingNotif) && "opacity-60"
              )}
            >
              {savingNotif ? (
                <IcSpinner className="h-3.5 w-3.5 animate-spin" />
              ) : notifSaved ? (
                <IcCheck className="h-3.5 w-3.5" />
              ) : null}
              {notifSaved ? "Saved" : "Save preferences"}
            </button>
          }
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest text-white/40">Min alert level</span>
          {(["green", "yellow", "red"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setMinLevel(lvl)}
              className={classNames(
                "rounded-lg border px-3 py-1 text-xs font-medium capitalize transition",
                minLevel === lvl
                  ? "border-white/25 bg-white/[0.06] text-white"
                  : "border-white/8 text-white/45"
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {CHANNELS.map((c) => (
            <div
              key={c.key}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] p-3"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-white/50">{c.icon}</span>
                <span className="text-sm text-white/85">{c.label}</span>
              </div>
              <Toggle
                on={!!channels[c.key]}
                set={(v) => setChannels((s) => ({ ...s, [c.key]: v }))}
              />
            </div>
          ))}
        </div>

        {/* Live delivery — browser push + outbound webhook */}
        <NotificationChannels />
      </GlassCard>
    </div>
  );
}

function ExchangeRow({
  exchange,
  connected,
  persist,
}: {
  exchange: string;
  connected?: { keyMask: string };
  persist: boolean;
}) {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [saving, start] = useTransition();
  const [done, setDone] = useState(Boolean(connected));
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!persist) return;
    setError(null);
    start(async () => {
      const res = await saveExchangeKeyAction({ exchange, apiKey, apiSecret });
      if (res?.ok) {
        setDone(true);
        setApiKey("");
        setApiSecret("");
      } else {
        setError(res?.error ?? "Failed to save.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <IcKey className="h-4 w-4 text-white/40" />
      <span className="w-32 text-sm font-medium text-white/85">{exchange}</span>
      <input
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder={connected ? `Connected · ${connected.keyMask}` : "API key"}
        className="min-w-0 flex-1 rounded-lg border border-white/8 bg-base-950/50 px-3 py-1.5 text-xs text-white/80 placeholder:text-white/25 focus:border-signal-green/40 focus:outline-none"
      />
      <input
        type="password"
        value={apiSecret}
        onChange={(e) => setApiSecret(e.target.value)}
        placeholder="Secret"
        className="min-w-0 flex-1 rounded-lg border border-white/8 bg-base-950/50 px-3 py-1.5 text-xs text-white/80 placeholder:text-white/25 focus:border-signal-green/40 focus:outline-none"
      />
      <button
        onClick={save}
        disabled={!persist || saving || !apiKey || !apiSecret}
        className={classNames(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition",
          done
            ? "border-signal-green/40 bg-signal-green/10 text-signal-green"
            : "border-white/15 bg-white/[0.04] text-white/70 hover:text-white",
          (!persist || saving || !apiKey || !apiSecret) && "opacity-60"
        )}
      >
        {saving ? (
          <IcSpinner className="h-3 w-3 animate-spin" />
        ) : done ? (
          <IcCheck className="h-3 w-3" />
        ) : null}
        {done && !apiKey ? "Connected" : "Save"}
      </button>
      {error && <span className="w-full text-[11px] text-signal-red">{error}</span>}
    </div>
  );
}
