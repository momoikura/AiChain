import { TokenDetail } from "@/components/tokens/TokenDetail";
import { currentTick } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { symbol: string } }) {
  return <TokenDetail symbol={params.symbol.toUpperCase()} initialTick={currentTick()} />;
}
