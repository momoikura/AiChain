"use client";

import { useEffect, useState, useTransition } from "react";
import { IcBell, IcCheck, IcClose, IcNetwork, IcSpinner } from "@/components/brand/icons";
import { classNames } from "@/lib/format";
import { testWebhookAction } from "@/app/(app)/settings/actions";

/**
 * Real notification delivery controls:
 *  - Browser push via the Notification API (no service required)
 *  - Outbound webhook (Discord / Slack / generic) with a live test send
 */
export function NotificationChannels() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sending, startSend] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
    try {
      const saved = localStorage.getItem("sentinel_webhook");
      if (saved) setUrl(saved);
    } catch {}
  }, []);

  async function enableBrowser() {
    if (perm === "unsupported") return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") {
      new Notification("SENTINEL · notifications enabled", {
        body: "Alerts at or above your minimum level will appear here.",
      });
    }
  }

  function testWebhook() {
    setResult(null);
    try {
      localStorage.setItem("sentinel_webhook", url.trim());
    } catch {}
    startSend(async () => {
      const res = await testWebhookAction(url);
      setResult(
        res.ok
          ? { ok: true, msg: `Delivered (HTTP ${res.status})` }
          : { ok: false, msg: res.error ?? "Delivery failed" }
      );
    });
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {/* Browser push */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm text-white/85">
            <span className="text-signal-green"><IcBell size={16} /></span> Browser push
          </span>
          <span
            className={classNames(
              "text-[10px] font-bold uppercase tracking-wider",
              perm === "granted" ? "text-signal-green" : perm === "denied" ? "text-signal-red" : "text-white/40"
            )}
          >
            {perm === "granted" ? "● enabled" : perm === "denied" ? "○ blocked" : perm === "unsupported" ? "unsupported" : "○ off"}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-white/40">
          Native OS notifications while the terminal is open. No service or key required.
        </p>
        {perm !== "granted" && perm !== "unsupported" && (
          <button
            onClick={enableBrowser}
            className="mt-2 rounded-lg border border-signal-green/40 bg-signal-green/10 px-3 py-1.5 text-xs font-medium text-signal-green transition hover:bg-signal-green/20"
          >
            Enable notifications
          </button>
        )}
        {perm === "denied" && (
          <p className="mt-2 text-[11px] text-signal-red/80">
            Blocked in the browser — re-enable it in site settings.
          </p>
        )}
      </div>

      {/* Webhook */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <span className="flex items-center gap-2 text-sm text-white/85">
          <span className="text-accent-cyan"><IcNetwork size={16} /></span> Webhook
        </span>
        <p className="mt-1 text-[11px] leading-relaxed text-white/40">
          Discord, Slack or any JSON endpoint. https only — private hosts refused.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/…"
            className="min-w-0 flex-1 rounded-lg border border-white/8 bg-base-950/50 px-2.5 py-1.5 text-xs text-white/80 placeholder:text-white/25 focus:border-signal-green/40 focus:outline-none"
          />
          <button
            onClick={testWebhook}
            disabled={sending || !url.trim()}
            className={classNames(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition",
              "border-white/15 bg-white/[0.04] text-white/70 hover:text-white",
              (sending || !url.trim()) && "opacity-60"
            )}
          >
            {sending ? <IcSpinner size={12} className="animate-spin" /> : null}
            Send test
          </button>
        </div>
        {result && (
          <p className={classNames("mt-1.5 flex items-center gap-1 text-[11px]", result.ok ? "text-signal-green" : "text-signal-red")}>
            {result.ok ? <IcCheck size={12} /> : <IcClose size={12} />} {result.msg}
          </p>
        )}
      </div>
    </div>
  );
}
