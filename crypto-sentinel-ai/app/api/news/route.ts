import { NextResponse } from "next/server";
import { fetchNews } from "@/lib/news/rss";

export const runtime = "nodejs";
export const revalidate = 300;

/** Real crypto headlines aggregated from keyless RSS feeds. */
export async function GET() {
  const { items, stale } = await fetchNews(40);
  return NextResponse.json(
    { items, stale, at: Date.now() },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
