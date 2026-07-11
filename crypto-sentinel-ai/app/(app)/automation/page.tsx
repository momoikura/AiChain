import { AutomationView } from "@/components/automation/AutomationView";
import { getRules } from "@/lib/data/portfolio";
import { listRules } from "@/lib/server/db/rules";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function Page() {
  const configured = isSupabaseConfigured();
  // Configured → persisted rules from Supabase (seeded on first use).
  // Preview mode → in-memory fixtures so the page still works.
  const rules = configured ? await listRules() : getRules();
  return <AutomationView initialRules={rules} persist={configured} />;
}
