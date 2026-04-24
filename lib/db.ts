import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

export function isTursoConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

export function getTursoClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error("TURSO_DATABASE_URL と TURSO_AUTH_TOKEN を .env.local に設定してください。");
  }
  if (!client) {
    client = createClient({ url, authToken });
  }
  return client;
}

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = getTursoClient();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS worries (
          id TEXT PRIMARY KEY NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `);
      await db.execute(
        "CREATE INDEX IF NOT EXISTS worries_category_idx ON worries(category)",
      );
      await db.execute(
        "CREATE INDEX IF NOT EXISTS worries_created_idx ON worries(created_at)",
      );
      const worryCols = await db.execute("PRAGMA table_info(worries)");
      const hasWorryMatch = worryCols.rows.some((r) => {
        const row = r as Record<string, unknown>;
        return row.name === "match_type";
      });
      if (!hasWorryMatch) {
        await db.execute("ALTER TABLE worries ADD COLUMN match_type TEXT");
      }

      await db.execute(`
        CREATE TABLE IF NOT EXISTS quotes (
          id TEXT PRIMARY KEY NOT NULL,
          content TEXT NOT NULL,
          author TEXT NOT NULL,
          explanation TEXT NOT NULL DEFAULT '',
          category TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `);
      await db.execute(
        "CREATE INDEX IF NOT EXISTS quotes_category_idx ON quotes(category)",
      );
      const quoteCols = await db.execute("PRAGMA table_info(quotes)");
      const hasExplanation = quoteCols.rows.some((r) => {
        const row = r as Record<string, unknown>;
        return row.name === "explanation";
      });
      if (!hasExplanation) {
        await db.execute("ALTER TABLE quotes ADD COLUMN explanation TEXT NOT NULL DEFAULT ''");
      }
    })();
  }
  await schemaReady;
}
