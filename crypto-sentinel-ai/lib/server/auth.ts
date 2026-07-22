import "server-only";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Request-scoped authenticated user.
 *
 * `supabase.auth.getUser()` is a *network* call to the Supabase auth server —
 * it revalidates the token rather than reading the cookie. Every server-side
 * data helper was calling it independently, so rendering a single page could
 * chain three or four sequential round-trips before any HTML was produced
 * (middleware, the layout, then once per data helper).
 *
 * React's `cache()` is per-request, so every caller within one render shares a
 * single call. Server actions are separate requests and correctly get their own,
 * which keeps the authorization check honest — this is a latency fix, not a
 * relaxation of it.
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
