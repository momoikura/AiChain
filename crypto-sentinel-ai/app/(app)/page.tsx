import { Dashboard } from "@/components/dashboard/Dashboard";
import { currentTick } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default function Page() {
  return <Dashboard initialTick={currentTick()} />;
}
