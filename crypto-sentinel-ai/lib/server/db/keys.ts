import { createClient } from "@/lib/supabase/server";
import { encryptSecret, maskSecret } from "@/lib/server/crypto";

/**
 * Exchange API keys. Secrets are encrypted app-side (AES-256-GCM) before they
 * ever reach Supabase — the DB only stores ciphertext. Listing returns masked
 * previews, never plaintext.
 */

export interface ExchangeKeyView {
  id: string;
  exchange: string;
  keyMask: string;
  permissions: string[];
  createdAt: number;
}

export async function listExchangeKeys(): Promise<ExchangeKeyView[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("exchange_keys")
    .select("id, exchange, api_key_cipher, permissions, created_at");
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id as string,
    exchange: r.exchange as string,
    // We show a fixed mask rather than decrypting on list for safety.
    keyMask: maskSecret(String(r.api_key_cipher).slice(0, 12)),
    permissions: (r.permissions as string[]) ?? [],
    createdAt: new Date(r.created_at as string).getTime(),
  }));
}

export async function saveExchangeKey(input: {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  permissions?: string[];
}): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("exchange_keys").upsert(
    {
      user_id: user.id,
      exchange: input.exchange,
      api_key_cipher: encryptSecret(input.apiKey),
      api_secret_cipher: encryptSecret(input.apiSecret),
      permissions: input.permissions ?? [],
    },
    { onConflict: "user_id,exchange" }
  );
  if (error) throw error;
}

export async function deleteExchangeKey(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("exchange_keys").delete().eq("id", id);
  if (error) throw error;
}
