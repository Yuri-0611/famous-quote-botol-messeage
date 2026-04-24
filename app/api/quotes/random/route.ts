import { NextResponse } from "next/server";
import { and, or, sql } from "drizzle-orm";
import { ensureSchema, isTursoConfigured } from "@/lib/db";
import { getDb } from "@/lib/drizzle";
import { normalizeGenre } from "@/lib/genres";
import { quotes } from "@/lib/schema";

export const runtime = "nodejs";

function parseCategories(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

function hasCategoryExpr(category: string) {
  return sql<boolean>`instr(',' || ${quotes.category} || ',', ',' || ${category} || ',') > 0`;
}

export async function GET(req: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json({ error: "データベースが未設定です。" }, { status: 503 });
  }
  const sp = new URL(req.url).searchParams;
  const rawFromArray = sp.getAll("category");
  const rawFromCsv = sp.get("categories");
  const requestedRaw =
    rawFromArray.length > 0
      ? rawFromArray
      : rawFromCsv
        ? rawFromCsv.split(",")
        : [];
  if (requestedRaw.length === 0) {
    return NextResponse.json({ error: "category/categories が必要です。" }, { status: 400 });
  }
  const requested = requestedRaw
    .map((x) => normalizeGenre(x))
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const uniqRequested = Array.from(new Set(requested));
  if (uniqRequested.length < 1 || uniqRequested.length > 2) {
    return NextResponse.json({ error: "ジャンルは1〜2件で指定してください。" }, { status: 400 });
  }

  try {
    await ensureSchema();
    const db = getDb();
    let picked: Array<{
      id: string;
      content: string;
      author: string;
      explanation: string;
      category: string;
      createdAt: number;
    }> = [];
    let matchType: "and" | "or" = "or";

    if (uniqRequested.length === 2) {
      picked = await db
        .select()
        .from(quotes)
        .where(and(hasCategoryExpr(uniqRequested[0]), hasCategoryExpr(uniqRequested[1])))
        .orderBy(sql`RANDOM()`)
        .limit(1);
      if (picked.length > 0) {
        matchType = "and";
      }
    }

    if (picked.length === 0) {
      picked = await db
        .select()
        .from(quotes)
        .where(
          uniqRequested.length === 2
            ? or(hasCategoryExpr(uniqRequested[0]), hasCategoryExpr(uniqRequested[1]))
            : hasCategoryExpr(uniqRequested[0]),
        )
        .orderBy(sql`RANDOM()`)
        .limit(1);
      matchType = "or";
    }

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
      categories: parseCategories(row.category),
      matchType,
      requestedCategories: uniqRequested,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました。" }, { status: 500 });
  }
}
