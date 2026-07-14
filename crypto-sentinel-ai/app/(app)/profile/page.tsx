import { ProfileConsole } from "@/components/profile/ProfileConsole";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let user = { name: "Preview Operator", email: "operator@sentinel.ai" };
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
  }
  return <ProfileConsole name={user.name} email={user.email} />;
}
