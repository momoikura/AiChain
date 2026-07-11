"use server";

import { setRuleEnabled } from "@/lib/server/db/rules";

/** Persist a rule's enabled state. Called from the Automation view on toggle. */
export async function toggleRuleAction(id: string, enabled: boolean) {
  await setRuleEnabled(id, enabled);
}
