import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { ensureSchema, isTursoConfigured } from "@/lib/db";
import { getDb } from "@/lib/drizzle";
import { normalizeGenre } from "@/lib/genres";
import { worries } from "@/lib/schema";

export const runtime = "nodejs";

const MAX_LEN = 2000;
const MIN_LEN = 1;

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
  const contentRaw = (body as { content?: unknown }).content;
  const categoryRaw = (body as { category?: unknown }).category;
  if (typeof contentRaw !== "string" || typeof categoryRaw !== "string") {
    return NextResponse.json({ error: "content と category が必要です。" }, { status: 400 });
  }
  const content = contentRaw.trim();
  if (content.length < MIN_LEN || content.length > MAX_LEN) {
    return NextResponse.json(
      { error: `悩みは ${MIN_LEN}〜${MAX_LEN} 文字で入力してください。` },
      { status: 400 },
    );
  }
  const category = normalizeGenre(categoryRaw);
  if (!category) {
    return NextResponse.json({ error: "ジャンルが不正です。" }, { status: 400 });
  }

  try {
    await ensureSchema();
    const db = getDb();
    const id = randomUUID();
    const createdAt = Date.now();
    await db.insert(worries).values({ id, content, category, createdAt });
    return NextResponse.json({ worryId: id, category });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "保存に失敗しました。" }, { status: 500 });
  }
}
