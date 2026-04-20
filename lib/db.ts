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

async function migrateSessionsIfNeeded(db: Client): Promise<void> {
  const t = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'",
  );
  if (t.rows.length === 0) {
    await db.execute(`
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        throw_balance INTEGER NOT NULL DEFAULT 0,
        daily_pick_count INTEGER NOT NULL DEFAULT 0,
        jst_day TEXT NOT NULL DEFAULT '',
        first_free_used INTEGER NOT NULL DEFAULT 0,
        email TEXT
      )
    `);
    return;
  }

  const info = await db.execute("PRAGMA table_info(sessions)");
  const cols = new Set(
    info.rows.map((r) => {
      const row = r as Record<string, unknown>;
      return typeof row.name === "string" ? row.name : "";
    }),
  );

  if (cols.has("throw_balance")) return;

  await db.execute("ALTER TABLE sessions RENAME TO sessions_legacy_mig");
  await db.execute(`
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      throw_balance INTEGER NOT NULL DEFAULT 0,
      daily_pick_count INTEGER NOT NULL DEFAULT 0,
      jst_day TEXT NOT NULL DEFAULT '',
      first_free_used INTEGER NOT NULL DEFAULT 0,
      email TEXT
    )
  `);
  if (cols.has("credits")) {
    await db.execute(`
      INSERT INTO sessions (id, throw_balance, daily_pick_count, jst_day, first_free_used, email)
      SELECT id, credits, 0, '', 0, NULL FROM sessions_legacy_mig
    `);
  } else {
    await db.execute(`
      INSERT INTO sessions (id, throw_balance, daily_pick_count, jst_day, first_free_used, email)
      SELECT id, 0, 0, '', 0, NULL FROM sessions_legacy_mig
    `);
  }
  await db.execute("DROP TABLE sessions_legacy_mig");
}

async function migrateBottlesColumnsIfNeeded(db: Client): Promise<void> {
  const info = await db.execute("PRAGMA table_info(bottles)");
  const cols = new Set(
    info.rows.map((r) => {
      const row = r as Record<string, unknown>;
      return typeof row.name === "string" ? row.name : "";
    }),
  );
  if (!cols.has("picked_count")) {
    await db.execute("ALTER TABLE bottles ADD COLUMN picked_count INTEGER NOT NULL DEFAULT 0");
  }
  if (!cols.has("author_session_id")) {
    await db.execute("ALTER TABLE bottles ADD COLUMN author_session_id TEXT");
  }
}

async function ensurePocketTable(db: Client): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pocket_items (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      quote_text TEXT NOT NULL,
      genre TEXT NOT NULL,
      kind TEXT NOT NULL,
      bottle_id TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await db.execute(
    "CREATE INDEX IF NOT EXISTS pocket_items_session_idx ON pocket_items(session_id)",
  );
}

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = getTursoClient();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS bottles (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          genre TEXT NOT NULL,
          createdAt INTEGER NOT NULL
        )
      `);
      await migrateBottlesColumnsIfNeeded(db);
      await migrateSessionsIfNeeded(db);
      await ensurePocketTable(db);
    })();
  }
  await schemaReady;
}

export type DbBottleRow = {
  id: string;
  content: string;
  genre: string;
  createdAt: number;
  picked_count?: number;
  author_session_id?: string | null;
};
