import type { Client } from "@libsql/client";
import { dailyPickCap, jstCalendarDay } from "@/lib/jst";

export type SessionQuotaRow = {
  id: string;
  throw_balance: number;
  daily_pick_count: number;
  jst_day: string;
  first_free_used: number;
  email: string | null;
};

function parseRow(r: Record<string, unknown> | undefined): SessionQuotaRow | null {
  if (!r) return null;
  const id = r.id;
  const throw_balance = r.throw_balance ?? r.throwBalance;
  const daily_pick_count = r.daily_pick_count ?? r.dailyPickCount;
  const jst_day = r.jst_day ?? r.jstDay;
  const first_free_used = r.first_free_used ?? r.firstFreeUsed;
  const email = r.email ?? null;
  if (typeof id !== "string") return null;
  return {
    id,
    throw_balance: typeof throw_balance === "number" ? throw_balance : Number(throw_balance) || 0,
    daily_pick_count:
      typeof daily_pick_count === "number" ? daily_pick_count : Number(daily_pick_count) || 0,
    jst_day: typeof jst_day === "string" ? jst_day : "",
    first_free_used:
      typeof first_free_used === "number" ? first_free_used : Number(first_free_used) || 0,
    email: typeof email === "string" && email.length > 0 ? email : null,
  };
}

export async function ensureSessionRow(db: Client, sid: string): Promise<void> {
  await db.execute({
    sql: `INSERT OR IGNORE INTO sessions (id, throw_balance, daily_pick_count, jst_day, first_free_used, email)
          VALUES (?, 0, 0, '', 0, NULL)`,
    args: [sid],
  });
}

export async function loadAndNormalizeSession(db: Client, sid: string): Promise<SessionQuotaRow> {
  await ensureSessionRow(db, sid);
  const today = jstCalendarDay();
  const rs = await db.execute({ sql: "SELECT * FROM sessions WHERE id = ?", args: [sid] });
  const raw = rs.rows[0] as Record<string, unknown> | undefined;
  let row = parseRow(raw);
  if (!row) {
    row = {
      id: sid,
      throw_balance: 0,
      daily_pick_count: 0,
      jst_day: "",
      first_free_used: 0,
      email: null,
    };
  }
  if (row.jst_day !== today) {
    await db.execute({
      sql: "UPDATE sessions SET daily_pick_count = 0, jst_day = ? WHERE id = ?",
      args: [today, sid],
    });
    row = { ...row, daily_pick_count: 0, jst_day: today };
  }
  return row;
}

export function picksRemainingToday(row: SessionQuotaRow): number {
  const cap = dailyPickCap(Boolean(row.email));
  return Math.max(0, cap - row.daily_pick_count);
}
