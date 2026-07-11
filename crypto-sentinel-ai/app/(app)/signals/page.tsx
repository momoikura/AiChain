import { SignalsView } from "@/components/signals/SignalsView";
import { currentTick } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default function Page() {
  return <SignalsView initialTick={currentTick()} />;
}
