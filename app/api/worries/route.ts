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
  const categoriesRaw = (body as { categories?: unknown }).categories;
  if (typeof contentRaw !== "string" || !Array.isArray(categoriesRaw)) {
    return NextResponse.json({ error: "content と categories が必要です。" }, { status: 400 });
  }
  const content = contentRaw.trim();
  if (content.length < MIN_LEN || content.length > MAX_LEN) {
    return NextResponse.json(
      { error: `悩みは ${MIN_LEN}〜${MAX_LEN} 文字で入力してください。` },
      { status: 400 },
    );
  }
  const categories = categoriesRaw
    .map((x) => (typeof x === "string" ? normalizeGenre(x) : null))
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const uniqCategories = Array.from(new Set(categories));
  if (uniqCategories.length < 1 || uniqCategories.length > 2) {
    return NextResponse.json({ error: "ジャンルは1〜2件で選択してください。" }, { status: 400 });
  }

  try {
    await ensureSchema();
    const db = getDb();
    const id = randomUUID();
    const createdAt = Date.now();
    await db.insert(worries).values({
      id,
      content,
      category: uniqCategories.join(","),
      matchType: null,
      createdAt,
    });
    return NextResponse.json({ worryId: id, categories: uniqCategories });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "保存に失敗しました。" }, { status: 500 });
  }
}
