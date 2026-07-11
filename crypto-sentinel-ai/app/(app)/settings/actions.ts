"use server";

import {
  saveNotificationSettings,
  type NotificationSettings,
} from "@/lib/server/db/settings";
import { saveExchangeKey } from "@/lib/server/db/keys";

export async function saveNotificationsAction(settings: NotificationSettings) {
  await saveNotificationSettings(settings);
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
