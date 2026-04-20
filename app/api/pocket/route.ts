import { NextResponse } from "next/server";
import { ensureSchema, getTursoClient, isTursoConfigured } from "@/lib/db";
import { WORRY_GENRES, type WorryGenre } from "@/lib/genres";
import { loadAndNormalizeSession } from "@/lib/session-quota";
import { getOrCreateSessionId, getSessionId } from "@/lib/session";

export const runtime = "nodejs";

const MAX_QUOTE = 800;

type PocketKind = "bottle" | "sea";

function parsePocketRow(r: Record<string, unknown>) {
  const id = r.id;
  const quote_text = r.quote_text ?? r.quoteText;
  const genre = r.genre;
  const kind = r.kind;
  const bottle_id = r.bottle_id ?? r.bottleId ?? null;
  const created_at = r.created_at ?? r.createdAt;
  if (
    typeof id !== "string" ||
    typeof quote_text !== "string" ||
    typeof genre !== "string" ||
    typeof kind !== "string" ||
    (typeof created_at !== "number" && typeof created_at !== "bigint")
  ) {
    return null;
  }
  return {
    id,
    quoteText: quote_text,
    genre: genre as WorryGenre,
    kind: kind as PocketKind,
    bottleId: typeof bottle_id === "string" ? bottle_id : null,
    savedAt: typeof created_at === "bigint" ? Number(created_at) : created_at,
  };
}

export async function GET() {
  if (!isTursoConfigured()) {
    return NextResponse.json({ items: [], turso: false, hasEmail: false });
  }
  const sid = await getSessionId();
  if (!sid) {
    return NextResponse.json({ items: [], turso: true, hasEmail: false });
  }
  try {
    await ensureSchema();
    const db = getTursoClient();
    const row = await loadAndNormalizeSession(db, sid);
    if (!row.email) {
      return NextResponse.json({ items: [], turso: true, hasEmail: false });
    }
    const rs = await db.execute({
      sql: `SELECT id, quote_text, genre, kind, bottle_id, created_at
            FROM pocket_items WHERE session_id = ? ORDER BY created_at DESC LIMIT 200`,
      args: [sid],
    });
    const items = rs.rows
      .map((x) => parsePocketRow(x as Record<string, unknown>))
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return NextResponse.json({ items, turso: true, hasEmail: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ items: [], turso: true, hasEmail: false, error: true }, { status: 503 });
  }
}

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
  const textRaw = (body as { text?: unknown }).text;
  const genreRaw = (body as { genre?: unknown }).genre;
  const kindRaw = (body as { kind?: unknown }).kind;
  const bottleIdRaw = (body as { bottleId?: unknown }).bottleId;
  if (typeof textRaw !== "string" || typeof genreRaw !== "string" || typeof kindRaw !== "string") {
    return NextResponse.json({ error: "text, genre, kind が必要です。" }, { status: 400 });
  }
  const text = textRaw.trim();
  if (!text || text.length > MAX_QUOTE) {
    return NextResponse.json({ error: `名言は1〜${MAX_QUOTE}文字で入力してください。` }, { status: 400 });
  }
  if (!(WORRY_GENRES as readonly string[]).includes(genreRaw)) {
    return NextResponse.json({ error: "ジャンルが不正です。" }, { status: 400 });
  }
  const genre = genreRaw as WorryGenre;
  if (kindRaw !== "bottle" && kindRaw !== "sea") {
    return NextResponse.json({ error: "kind は bottle か sea です。" }, { status: 400 });
  }
  const bottleId =
    typeof bottleIdRaw === "string" && bottleIdRaw.trim().length > 0 ? bottleIdRaw.trim() : null;

  const sid = await getOrCreateSessionId();
  try {
    await ensureSchema();
    const db = getTursoClient();
    const row = await loadAndNormalizeSession(db, sid);
    if (!row.email) {
      return NextResponse.json(
        { error: "サーバー保存はメール登録後にご利用いただけます。端末内のポケットに保存してください。", code: "need_email" },
        { status: 403 },
      );
    }
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    await db.execute({
      sql: `INSERT INTO pocket_items (id, session_id, quote_text, genre, kind, bottle_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, sid, text, genre, kindRaw, bottleId, createdAt],
    });
    return NextResponse.json({ ok: true, id, savedAt: createdAt });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "保存に失敗しました。" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json({ error: "データベースが未設定です。" }, { status: 503 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id が必要です。" }, { status: 400 });
  }
  const sid = await getSessionId();
  if (!sid) {
    return NextResponse.json({ error: "セッションがありません。" }, { status: 401 });
  }
  try {
    await ensureSchema();
    const db = getTursoClient();
    const row = await loadAndNormalizeSession(db, sid);
    if (!row.email) {
      return NextResponse.json({ error: "メール登録が必要です。" }, { status: 403 });
    }
    const r = await db.execute({
      sql: "DELETE FROM pocket_items WHERE id = ? AND session_id = ?",
      args: [id, sid],
    });
    if (Number(r.rowsAffected ?? 0) === 0) {
      return NextResponse.json({ error: "見つかりません。" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "削除に失敗しました。" }, { status: 500 });
  }
}
