import { NextResponse } from "next/server";
import { getSeaQuoteForGenres } from "@/lib/sea-quote-core";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const out = await getSeaQuoteForGenres((body as { genres?: unknown }).genres);
    return NextResponse.json({ text: out.text, source: out.source, genres: out.genres });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "エラー";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
