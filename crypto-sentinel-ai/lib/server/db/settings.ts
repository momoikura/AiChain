import { createClient } from "@/lib/supabase/server";

export type AlertLevelPref = "green" | "yellow" | "red";

export interface NotificationSettings {
  channels: Record<string, boolean>;
  minLevel: AlertLevelPref;
}

const DEFAULTS: NotificationSettings = {
  channels: {
    browser: true,
    email: true,
    telegram: false,
    discord: true,
    slack: false,
    webhook: false,
  },
  minLevel: "yellow",
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULTS;

  const { data, error } = await supabase
    .from("notification_settings")
    .select("channels, min_level")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return DEFAULTS;
  return {
    channels: { ...DEFAULTS.channels, ...(data.channels ?? {}) },
    minLevel: (data.min_level as AlertLevelPref) ?? "yellow",
  };
}

export async function saveNotificationSettings(s: NotificationSettings): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("notification_settings").upsert(
    {
      user_id: user.id,
      channels: s.channels,
      min_level: s.minLevel,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}
