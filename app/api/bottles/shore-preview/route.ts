import { NextResponse } from "next/server";
import { ensureSchema, getTursoClient, isTursoConfigured } from "@/lib/db";
import { WORRY_GENRES, type WorryGenre } from "@/lib/genres";

export const runtime = "nodejs";

/** 枠消費なし。浜辺に並べる漂流ボトルの id を最大5件返す（SQL RANDOM） */
export async function POST(req: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "データベースが未設定です。", ids: [] as string[] },
      { status: 503 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON", ids: [] }, { status: 400 });
  }
  const genreRaw = (body as { genre?: unknown }).genre;
  if (typeof genreRaw !== "string" || !(WORRY_GENRES as readonly string[]).includes(genreRaw)) {
    return NextResponse.json({ error: "有効なジャンルを1つ指定してください。", ids: [] }, { status: 400 });
  }
  const genre = genreRaw as WorryGenre;

  try {
    await ensureSchema();
    const db = getTursoClient();
    const rs = await db.execute({
      sql: "SELECT id FROM bottles WHERE genre = ? ORDER BY RANDOM() LIMIT 5",
      args: [genre],
    });
    const ids: string[] = [];
    for (const row of rs.rows) {
      const o = row as Record<string, unknown>;
      if (typeof o.id === "string") ids.push(o.id);
    }
    return NextResponse.json({ ids, genre });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました。", ids: [] }, { status: 500 });
  }
}
