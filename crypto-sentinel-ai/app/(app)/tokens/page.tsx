import { TokenUniverse } from "@/components/tokens/TokenUniverse";
import { currentTick } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default function Page() {
  return <TokenUniverse initialTick={currentTick()} />;
}
