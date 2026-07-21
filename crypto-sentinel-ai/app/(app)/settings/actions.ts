"use server";

import {
  saveNotificationSettings,
  type NotificationSettings,
} from "@/lib/server/db/settings";
import { saveExchangeKey } from "@/lib/server/db/keys";

export async function saveNotificationsAction(settings: NotificationSettings) {
  await saveNotificationSettings(settings);
}

/** Send a real test notification to the operator's webhook. */
export async function testWebhookAction(
  url: string
): Promise<{ ok: boolean; error?: string; status?: number }> {
  const { sendWebhook } = await import("@/lib/notify/dispatch");
  return sendWebhook(url, {
    level: "green",
    title: "SENTINEL · test alert",
    body: "Webhook connected. Alerts at or above your minimum level will be delivered here.",
  });
}

export async function saveExchangeKeyAction(input: {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  permissions?: string[];
}) {
  if (!input.apiKey || !input.apiSecret) {
    return { ok: false as const, error: "Both API key and secret are required." };
  }
  await saveExchangeKey(input);
  return { ok: true as const };
}
