import { createClient } from "@/lib/supabase/server";
import { getRules as defaultRuleFixtures } from "@/lib/data/portfolio";
import type { TradingRule } from "@/lib/types";

/**
 * Trading-rule persistence (Supabase, RLS-scoped to the signed-in user).
 * On first use we seed the account with sensible defaults so the Automation
 * page isn't empty.
 */

interface RuleRow {
  id: string;
  name: string;
  enabled: boolean;
  mode: TradingRule["mode"];
  side: TradingRule["side"];
  conditions: TradingRule["conditions"];
  risk: TradingRule["risk"];
  exchange: string;
  trigger_count: number;
  last_triggered: string | null;
}

function rowToRule(r: RuleRow): TradingRule {
  return {
    id: r.id,
    name: r.name,
    enabled: r.enabled,
    mode: r.mode,
    side: r.side,
    conditions: r.conditions,
    risk: r.risk,
    exchange: r.exchange,
    triggerCount: r.trigger_count,
    lastTriggered: r.last_triggered ? new Date(r.last_triggered).getTime() : undefined,
  };
}

export async function listRules(): Promise<TradingRule[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("trading_rules")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;

  if (!data || data.length === 0) {
    return seedDefaults(user.id);
  }
  return (data as RuleRow[]).map(rowToRule);
}

async function seedDefaults(userId: string): Promise<TradingRule[]> {
  const supabase = createClient();
  const defaults = defaultRuleFixtures().map((r) => ({
    user_id: userId,
    name: r.name,
    enabled: r.enabled,
    mode: r.mode,
    side: r.side,
    conditions: r.conditions,
    risk: r.risk,
    exchange: r.exchange,
    trigger_count: r.triggerCount,
    last_triggered: r.lastTriggered ? new Date(r.lastTriggered).toISOString() : null,
  }));
  const { data, error } = await supabase.from("trading_rules").insert(defaults).select("*");
  if (error) throw error;
  return (data as RuleRow[]).map(rowToRule);
}

export async function setRuleEnabled(id: string, enabled: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("trading_rules").update({ enabled }).eq("id", id);
  if (error) throw error;
}
