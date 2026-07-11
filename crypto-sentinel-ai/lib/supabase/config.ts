/**
 * Supabase environment configuration.
 *
 * The app runs in "preview mode" until these are set (see `.env.example`):
 *   NEXT_PUBLIC_SUPABASE_URL       — your project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  — the public anon key
 *   SUPABASE_SERVICE_ROLE_KEY      — server-only admin key (never exposed)
 *
 * `isSupabaseConfigured()` lets middleware / layouts fall back so the UI still
 * renders (unauthenticated preview) before you've wired your project — instead
 * of crashing. Once the two public vars are present, real auth kicks in.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
