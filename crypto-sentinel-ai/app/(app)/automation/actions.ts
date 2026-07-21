"use server";

import { setRuleEnabled, listRules } from "@/lib/server/db/rules";
import { evaluateRules, type Decision } from "@/lib/automation/evaluate";
import { getSnapshot, currentTick } from "@/lib/data/store";
import { getRules as ruleFixtures } from "@/lib/data/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/** Persist a rule's enabled state. Called from the Automation view on toggle. */
export async function toggleRuleAction(id: string, enabled: boolean) {
  await setRuleEnabled(id, enabled);
}

/**
 * Run the rule engine against the live feed and record PAPER decisions.
 *
 * SAFETY: paper only. Nothing here contacts an exchange or places an order —
 * decisions are evaluated, explained, and written to the `trades` table with
 * paper = true. Real execution is intentionally not implemented.
 */
export async function runEvaluationAction(
  emergencyStop: boolean
): Promise<{ ok: boolean; decisions: Decision[]; persisted: number; error?: string }> {
  try {
    const tick = currentTick();
    const snap = getSnapshot(tick);

    const rules = isSupabaseConfigured() ? await listRules() : ruleFixtures();

    const decisions = evaluateRules({
      rules,
      tokens: snap.tokens,
      alerts: snap.alerts,
      signalsBySymbol: snap.signalsBySymbol,
      emergencyStop,
      now: Date.now(),
    });

    // Record to the trade log (RLS scopes rows to the caller).
    let persisted = 0;
    if (isSupabaseConfigured() && decisions.length) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const rows = decisions.map((d) => ({
          user_id: user.id,
          symbol: d.symbol,
          side: d.side,
          status: d.status,
          qty: d.qty,
          price: d.price,
          pnl: null,
          rule_name: d.ruleName,
          reason: d.reason,
          paper: true, // never anything else
        }));
        const { error } = await supabase.from("trades").insert(rows);
        if (!error) persisted = rows.length;
      }
    }

    return { ok: true, decisions, persisted };
  } catch (e) {
    return {
      ok: false,
      decisions: [],
      persisted: 0,
      error: e instanceof Error ? e.message : "evaluation failed",
    };
  }
}
