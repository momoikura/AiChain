/**
 * Notification delivery — real outbound webhooks ($0, no provider account).
 *
 * Supports Discord and Slack incoming webhooks plus any generic JSON endpoint.
 * The payload shape is detected from the URL so the user only pastes a URL.
 *
 * SSRF guard: only https:// endpoints, and private/loopback hosts are refused —
 * a stored webhook must never be usable to probe internal infrastructure.
 */

export type AlertLevel = "green" | "yellow" | "red";

export interface NotifyPayload {
  level: AlertLevel;
  title: string;
  body: string;
  url?: string;
}

const LEVEL_COLOR: Record<AlertLevel, number> = {
  green: 0x00ff41,
  yellow: 0xffcf3a,
  red: 0xff2957,
};

const BLOCKED_HOST = /^(localhost$|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[?::1\]?$|172\.(1[6-9]|2\d|3[01])\.)/i;

export function validateWebhook(raw: string): { ok: true; url: URL } | { ok: false; error: string } {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, error: "Not a valid URL" };
  }
  if (url.protocol !== "https:") return { ok: false, error: "Webhook must use https://" };
  if (BLOCKED_HOST.test(url.hostname)) return { ok: false, error: "Private/loopback hosts are not allowed" };
  return { ok: true, url };
}

function bodyFor(url: URL, p: NotifyPayload): unknown {
  const host = url.hostname;

  if (host.includes("discord")) {
    return {
      username: "Sentinel",
      embeds: [
        {
          title: p.title,
          description: p.body,
          url: p.url,
          color: LEVEL_COLOR[p.level],
          footer: { text: `SENTINEL · ${p.level.toUpperCase()} · not financial advice` },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }
  if (host.includes("slack") || host.includes("hooks.slack")) {
    return { text: `*[${p.level.toUpperCase()}] ${p.title}*\n${p.body}${p.url ? `\n<${p.url}>` : ""}` };
  }
  // Generic JSON endpoint
  return { source: "sentinel", level: p.level, title: p.title, body: p.body, url: p.url, at: Date.now() };
}

export async function sendWebhook(
  rawUrl: string,
  payload: NotifyPayload
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const v = validateWebhook(rawUrl);
  if (!v.ok) return { ok: false, error: v.error };

  try {
    const res = await fetch(v.url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyFor(v.url, payload)),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    // Discord returns 204, Slack 200, generic anything 2xx.
    if (res.status >= 200 && res.status < 300) return { ok: true, status: res.status };
    return { ok: false, status: res.status, error: `Endpoint returned ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "delivery failed" };
  }
}
