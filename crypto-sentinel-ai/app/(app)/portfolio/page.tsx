import { PortfolioView } from "@/components/portfolio/PortfolioView";
import { currentTick } from "@/lib/data/store";
import { fetchLivePortfolio, type LivePortfolio } from "@/lib/server/portfolio/live";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function Page() {
  // Real balances from the operator's linked exchanges. Nothing linked (or a
  // failure) → the view renders its zero state; we never fabricate holdings.
  let live: LivePortfolio | null = null;
  if (isSupabaseConfigured()) {
    try {
      live = await fetchLivePortfolio();
    } catch {
      live = null;
    }
  }
  const connected = !!live && live.connected.length > 0;
  return <PortfolioView tick={currentTick()} connected={connected} live={live} />;
}
