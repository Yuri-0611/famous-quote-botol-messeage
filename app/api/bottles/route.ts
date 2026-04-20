import { NextResponse } from "next/server";
import { ensureSchema, getTursoClient, isTursoConfigured } from "@/lib/db";
import { WORRY_GENRES, type WorryGenre } from "@/lib/genres";
import { moderateThrowContent } from "@/lib/moderate-throw-content";
import { ensureSessionRow } from "@/lib/session-quota";
import { getOrCreateSessionId } from "@/lib/session";

export const runtime = "nodejs";

const MAX_CONTENT = 600;

export async function POST(req: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "データベースが未設定です。TURSO_DATABASE_URL と TURSO_AUTH_TOKEN を設定してください。" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const contentRaw = (body as { content?: unknown }).content;
  const genreRaw = (body as { genre?: unknown }).genre;
  if (typeof contentRaw !== "string" || typeof genreRaw !== "string") {
    return NextResponse.json({ error: "content と genre が必要です。" }, { status: 400 });
  }
  const content = contentRaw.trim();
  const genre = genreRaw as WorryGenre;
  if (!content || content.length > MAX_CONTENT) {
    return NextResponse.json({ error: `名言は1〜${MAX_CONTENT}文字で入力してください。` }, { status: 400 });
  }
  if (!(WORRY_GENRES as readonly string[]).includes(genre)) {
    return NextResponse.json({ error: "ジャンルが不正です。" }, { status: 400 });
  }

  const mod = await moderateThrowContent(content, genre);
  if (mod.type === "reject") {
    return NextResponse.json(
      {
        error: mod.friendly,
        code: "content_rejected",
        ...(mod.aiReason ? { hint: mod.aiReason } : {}),
      },
      { status: 422 },
    );
  }
  if (mod.type === "service_error") {
    return NextResponse.json(
      { error: mod.message, code: "moderation_error" },
      { status: 503 },
    );
  }

  const sid = await getOrCreateSessionId();
  const id = crypto.randomUUID();
  const createdAt = Date.now();

  try {
    await ensureSchema();
    const db = getTursoClient();
    await ensureSessionRow(db, sid);
    await db.batch([
      {
        sql: `INSERT INTO bottles (id, content, genre, createdAt, picked_count, author_session_id)
              VALUES (?, ?, ?, ?, 0, ?)`,
        args: [id, content, genre, createdAt, sid],
      },
      {
        sql: `INSERT INTO sessions (id, throw_balance) VALUES (?, 1)
              ON CONFLICT(id) DO UPDATE SET throw_balance = sessions.throw_balance + 1`,
        args: [sid],
      },
    ]);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "保存に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id, createdAt, throwBalanceAdded: 1 });
}
