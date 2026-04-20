import { NextResponse } from "next/server";
import { ensureSchema, getTursoClient, isTursoConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!isTursoConfigured()) {
    return NextResponse.json({ ok: false, turso: false, message: "Turso 環境変数が未設定です。" });
  }
  try {
    await ensureSchema();
    await getTursoClient().execute("SELECT 1");
    return NextResponse.json({ ok: true, turso: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, turso: true, message: "Turso 接続に失敗しました。" }, { status: 503 });
  }
}
