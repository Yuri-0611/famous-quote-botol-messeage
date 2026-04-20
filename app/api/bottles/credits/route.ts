import { NextResponse } from "next/server";
import { ensureSchema, getTursoClient, isTursoConfigured } from "@/lib/db";
import { dailyPickCap } from "@/lib/jst";
import { loadAndNormalizeSession, picksRemainingToday } from "@/lib/session-quota";
import { getOrCreateSessionId } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  if (!isTursoConfigured()) {
    return NextResponse.json({
      turso: false,
      throwBalance: 0,
      dailyUsed: 0,
      dailyCap: 5,
      picksRemainingToday: 0,
      firstFreeAvailable: false,
      hasEmail: false,
      jstToday: "",
    });
  }
  const sid = await getOrCreateSessionId();
  try {
    await ensureSchema();
    const db = getTursoClient();
    const row = await loadAndNormalizeSession(db, sid);
    const cap = dailyPickCap(Boolean(row.email));
    const rem = picksRemainingToday(row);
    const firstFreeAvailable = row.first_free_used === 0;
    return NextResponse.json({
      turso: true,
      throwBalance: row.throw_balance,
      dailyUsed: row.daily_pick_count,
      dailyCap: cap,
      picksRemainingToday: rem,
      firstFreeAvailable,
      hasEmail: Boolean(row.email),
      jstToday: row.jst_day,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        turso: true,
        error: true,
        throwBalance: 0,
        dailyUsed: 0,
        dailyCap: 5,
        picksRemainingToday: 0,
        firstFreeAvailable: false,
        hasEmail: false,
        jstToday: "",
      },
      { status: 503 },
    );
  }
}
