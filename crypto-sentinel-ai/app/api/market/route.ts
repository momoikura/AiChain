import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/market/coingecko";

export const runtime = "nodejs";
// Route response cached 60s; the upstream CoinGecko fetch is cached separately.
export const revalidate = 60;

/** Live market quotes for the tracked universe (real, keyless, free). */
export async function GET() {
  const { quotes, stale } = await fetchQuotes();
  return NextResponse.json(
    { quotes, stale, at: Date.now() },
    {
      headers: {
        // Allow a short shared cache; clients poll every 60s anyway.
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
