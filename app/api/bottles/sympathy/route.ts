import { NextResponse } from "next/server";
import { ensureSchema, getTursoClient, isTursoConfigured } from "@/lib/db";
import { getOrCreateSessionId } from "@/lib/session";

export const runtime = "nodejs";

/** 自分が流したボトルが拾われた累計回数（共感の可視化） */
export async function GET() {
  if (!isTursoConfigured()) {
    return NextResponse.json({ turso: false, totalReach: 0 });
  }
  const sid = await getOrCreateSessionId();
  try {
    await ensureSchema();
    const db = getTursoClient();
    const rs = await db.execute({
      sql: `SELECT COALESCE(SUM(picked_count), 0) AS n FROM bottles WHERE author_session_id = ?`,
      args: [sid],
    });
    const row = rs.rows[0] as Record<string, unknown> | undefined;
    const raw = row?.n;
    const totalReach = typeof raw === "number" ? raw : Number(raw) || 0;
    return NextResponse.json({ turso: true, totalReach });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ turso: true, totalReach: 0, error: true }, { status: 503 });
  }
}
