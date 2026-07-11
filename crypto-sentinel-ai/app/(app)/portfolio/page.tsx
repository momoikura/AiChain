import { PortfolioView } from "@/components/portfolio/PortfolioView";
import { currentTick } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PortfolioView tick={currentTick()} />;
}
