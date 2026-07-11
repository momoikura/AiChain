import { SettingsView } from "@/components/settings/SettingsView";
import { getNotificationSettings } from "@/lib/server/db/settings";
import { listExchangeKeys } from "@/lib/server/db/keys";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function Page() {
  const configured = isSupabaseConfigured();
  const settings = configured
    ? await getNotificationSettings()
    : {
        channels: {
          browser: true,
          email: true,
          telegram: false,
          discord: true,
          slack: false,
          webhook: false,
        },
        minLevel: "yellow" as const,
      };
  const keys = configured ? await listExchangeKeys() : [];

  return <SettingsView initialSettings={settings} initialKeys={keys} persist={configured} />;
}
