import { MemeRadar } from "@/components/memes/MemeRadar";
import { currentTick } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default function Page() {
  return <MemeRadar initialTick={currentTick()} />;
}
