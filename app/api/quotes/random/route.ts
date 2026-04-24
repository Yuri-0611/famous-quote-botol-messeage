import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { ensureSchema, isTursoConfigured } from "@/lib/db";
import { getDb } from "@/lib/drizzle";
import { normalizeGenre } from "@/lib/genres";
import { quotes } from "@/lib/schema";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json({ error: "データベースが未設定です。" }, { status: 503 });
  }
  const categoryRaw = new URL(req.url).searchParams.get("category");
  if (!categoryRaw) {
    return NextResponse.json({ error: "category が必要です。" }, { status: 400 });
  }
  const category = normalizeGenre(categoryRaw);
  if (!category) {
    return NextResponse.json({ error: "ジャンルが不正です。" }, { status: 400 });
  }

  try {
    await ensureSchema();
    const db = getDb();
    const picked = await db
      .select()
      .from(quotes)
      .where(eq(quotes.category, category))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    const row = picked[0];
    if (!row) {
      return NextResponse.json(
        { error: "このジャンルの名言がありません。`npm run seed-quotes` を実行してください。" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: row.id,
      content: row.content,
      author: row.author,
      explanation: row.explanation,
      category: row.category,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました。" }, { status: 500 });
  }
}
