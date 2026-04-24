import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ensureSchema, isTursoConfigured } from "@/lib/db";
import { getDb } from "@/lib/drizzle";
import { worries } from "@/lib/schema";

export const runtime = "nodejs";

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
  const worryId = (body as { worryId?: unknown }).worryId;
  const matchType = (body as { matchType?: unknown }).matchType;
  if (typeof worryId !== "string" || worryId.length < 10) {
    return NextResponse.json({ error: "worryId が必要です。" }, { status: 400 });
  }
  if (matchType !== "and" && matchType !== "or") {
    return NextResponse.json({ error: "matchType は and または or です。" }, { status: 400 });
  }

  try {
    await ensureSchema();
    const db = getDb();
    const [row] = await db.select({ id: worries.id }).from(worries).where(eq(worries.id, worryId)).limit(1);
    if (!row) {
      return NextResponse.json({ error: "該当する悩みが見つかりません。" }, { status: 404 });
    }
    await db.update(worries).set({ matchType }).where(eq(worries.id, worryId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "更新に失敗しました。" }, { status: 500 });
  }
}
