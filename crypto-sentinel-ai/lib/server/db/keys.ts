import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/server/auth";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/server/crypto";

/**
 * Exchange API keys. Secrets are encrypted app-side (AES-256-GCM) before they
 * ever reach Supabase â€” the DB only stores ciphertext. Listing returns masked
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
  const user = await getAuthUser();
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
  const user = await getAuthUser();
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

/**
 * SERVER-ONLY: decrypt the operator's own keys for signing exchange requests.
 * RLS scopes this to the caller, so it can never return another user's keys.
 * Never expose the result to the client or log it.
 */
export async function getExchangeCredentials(): Promise<
  { exchange: string; apiKey: string; apiSecret: string }[]
> {
  const supabase = createClient();
  const user = await getAuthUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("exchange_keys")
    .select("exchange, api_key_cipher, api_secret_cipher");
  if (error) throw error;

  const out: { exchange: string; apiKey: string; apiSecret: string }[] = [];
  for (const row of data ?? []) {
    try {
      out.push({
        exchange: row.exchange as string,
        apiKey: decryptSecret(row.api_key_cipher as string),
        apiSecret: decryptSecret(row.api_secret_cipher as string),
      });
    } catch {
      // Ciphertext unreadable (e.g. APIKEY_ENC_SECRET rotated) â€” skip it.
    }
  }
  return out;
}

export async function deleteExchangeKey(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("exchange_keys").delete().eq("id", id);
  if (error) throw error;
}
