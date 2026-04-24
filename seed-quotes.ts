/**
 * quotes テーブルへ data/seed-quotes.json（150件）を投入します。
 * 既存の quotes は全削除してから挿入します（冪等なフルシード）。
 *
 * 実行例:
 *   npx tsx --env-file=.env.local seed-quotes.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ensureSchema, getTursoClient } from "./lib/db";
import * as schema from "./lib/schema";
import { drizzle } from "drizzle-orm/libsql";

type Row = {
  id: string;
  category: string;
  author: string;
  content: string;
  created_at?: number;
};

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) {
    throw new Error("TURSO_DATABASE_URL と TURSO_AUTH_TOKEN を設定してください（例: --env-file=.env.local）。");
  }

  await ensureSchema();
  const client = getTursoClient();
  const db = drizzle(client, { schema });

  const path = join(process.cwd(), "data", "seed-quotes.json");
  const raw = JSON.parse(readFileSync(path, "utf8")) as Row[];
  if (!Array.isArray(raw) || raw.length !== 150) {
    throw new Error(`seed-quotes.json は150件である必要があります（現在 ${raw?.length ?? 0} 件）。`);
  }

  await db.delete(schema.quotes);
  for (const row of raw) {
    await db.insert(schema.quotes).values({
      id: row.id,
      content: row.content,
      author: row.author,
      category: row.category,
      createdAt: typeof row.created_at === "number" ? row.created_at : Date.now(),
    });
  }

  console.log(`Inserted ${raw.length} quotes.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
