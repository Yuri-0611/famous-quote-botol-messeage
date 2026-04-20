import { NextResponse } from "next/server";
import { ensureSchema, getTursoClient, isTursoConfigured } from "@/lib/db";
import { ensureSessionRow } from "@/lib/session-quota";
import { getOrCreateSessionId } from "@/lib/session";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json({ error: "データベースが未設定です。" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const emailRaw = (body as { email?: unknown }).email;
  if (typeof emailRaw !== "string") {
    return NextResponse.json({ error: "メールアドレスを入力してください。" }, { status: 400 });
  }
  const email = emailRaw.trim().toLowerCase();
  if (email.length > 120 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "メールアドレスの形式が正しくありません。" }, { status: 400 });
  }

  const sid = await getOrCreateSessionId();
  try {
    await ensureSchema();
    const db = getTursoClient();
    await ensureSessionRow(db, sid);
    await db.execute({
      sql: "UPDATE sessions SET email = ? WHERE id = ?",
      args: [email, sid],
    });
    return NextResponse.json({ ok: true, dailyCap: 10 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "保存に失敗しました。" }, { status: 500 });
  }
}
