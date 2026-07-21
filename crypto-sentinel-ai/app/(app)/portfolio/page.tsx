import { PortfolioView } from "@/components/portfolio/PortfolioView";
import { currentTick } from "@/lib/data/store";
import { listExchangeKeys } from "@/lib/server/db/keys";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function Page() {
  // The portfolio only has data once the operator has actually linked an
  // exchange. No connection → empty state (never fabricate holdings).
  let connected = false;
  if (isSupabaseConfigured()) {
    try {
      connected = (await listExchangeKeys()).length > 0;
    } catch {
      connected = false;
    }
  }
  return <PortfolioView tick={currentTick()} connected={connected} />;
}
