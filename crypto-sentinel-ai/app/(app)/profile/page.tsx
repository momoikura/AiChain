import { ProfileConsole } from "@/components/profile/ProfileConsole";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listExchangeKeys } from "@/lib/server/db/keys";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let user = { name: "Preview Operator", email: "operator@sentinel.ai" };
  let connectedExchanges: string[] = [];

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      user = {
        name: (authUser.user_metadata?.name as string) || authUser.email || "Operator",
        email: authUser.email || "operator@sentinel.ai",
      };
    }
    // Real linked exchanges only — never fabricate connection status.
    try {
      connectedExchanges = (await listExchangeKeys()).map((k) => k.exchange);
    } catch {
      connectedExchanges = [];
    }
  }

  return (
    <ProfileConsole
      name={user.name}
      email={user.email}
      connectedExchanges={connectedExchanges}
    />
  );
}
