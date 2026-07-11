import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint — reports whether env vars reached this build.
 * Returns booleans + the (public) URL only. No secret values are exposed.
 * Safe to leave in; remove later if you like.
 *   → visit https://YOUR-SITE/api/health
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return NextResponse.json({
    supabaseUrlPresent: Boolean(url),
    supabaseUrl: url || null, // public value — fine to show
    urlLooksValid: /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url),
    urlHasBadRestSuffix: /\/rest\/v1/.test(url),
    anonKeyPresent: Boolean(anon),
    anonKeyLooksLikeJwt: anon.startsWith("eyJ"),
    serviceRolePresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    encSecretPresent: Boolean(process.env.APIKEY_ENC_SECRET),
    nodeEnv: process.env.NODE_ENV,
  });
}
