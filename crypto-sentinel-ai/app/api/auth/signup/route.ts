import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet. Add your project keys to .env.local." },
      { status: 503 }
    );
  }

  let body: { email?: string; name?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email = "", name = "", password = "" } = body;
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (name.trim().length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name.trim() } },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // When email confirmation is enabled, no session is returned yet.
  const needsConfirmation = !data.session;

  return NextResponse.json({
    user: {
      id: data.user?.id,
      email: data.user?.email,
      name: data.user?.user_metadata?.name ?? name,
    },
    needsConfirmation,
  });
}
