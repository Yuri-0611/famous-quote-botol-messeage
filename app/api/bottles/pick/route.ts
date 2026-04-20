import { NextResponse } from "next/server";
import { ensureSchema, getTursoClient, type DbBottleRow } from "@/lib/db";
import { isTursoConfigured } from "@/lib/db";
import { dailyPickCap, jstCalendarDay } from "@/lib/jst";
import { loadAndNormalizeSession } from "@/lib/session-quota";
import { GENRE_LABELS, WORRY_GENRES, type WorryGenre } from "@/lib/genres";
import { getSeaQuoteForGenres } from "@/lib/sea-quote-core";
import { getOrCreateSessionId } from "@/lib/session";

export const runtime = "nodejs";

function rowToBottle(row: Record<string, unknown>): DbBottleRow | null {
  const id = row.id;
  const content = row.content;
  const genre = row.genre;
  const createdAt = row.createdAt;
  if (
    typeof id !== "string" ||
    typeof content !== "string" ||
    typeof genre !== "string" ||
    typeof createdAt !== "number"
  ) {
    return null;
  }
  return { id, content, genre, createdAt };
}

type ReserveMode = "first" | "throw";

async function incrementPickedCount(db: ReturnType<typeof getTursoClient>, bottleId: string): Promise<void> {
  await db.execute({
    sql: "UPDATE bottles SET picked_count = picked_count + 1 WHERE id = ?",
    args: [bottleId],
  });
}

export async function POST(req: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "データベースが未設定です。TURSO_DATABASE_URL と TURSO_AUTH_TOKEN を設定してください。" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const genreRaw = (body as { genre?: unknown }).genre;
  if (typeof genreRaw !== "string" || !(WORRY_GENRES as readonly string[]).includes(genreRaw)) {
    return NextResponse.json({ error: "有効なジャンルを1つ指定してください。" }, { status: 400 });
  }
  const genre = genreRaw as WorryGenre;

  const bottleIdRaw = (body as { bottleId?: unknown }).bottleId;
  const bottleId =
    typeof bottleIdRaw === "string" && bottleIdRaw.trim().length > 0 ? bottleIdRaw.trim() : null;

  const sid = await getOrCreateSessionId();
  const today = jstCalendarDay();

  try {
    await ensureSchema();
    const db = getTursoClient();
    const row = await loadAndNormalizeSession(db, sid);
    const cap = dailyPickCap(Boolean(row.email));

    if (row.daily_pick_count >= cap) {
      return NextResponse.json(
        {
          error: "今日の無料枠は使い切りました。明日0時（日本時間）にまた5回リセットされます。",
          code: "daily_exhausted",
        },
        { status: 402 },
      );
    }

    let mode: ReserveMode | null = null;
    if (row.first_free_used === 0) mode = "first";
    else if (row.throw_balance > 0) mode = "throw";
    else {
      return NextResponse.json(
        {
          error:
            "拾うチャンスがありません。初回の1本は流さなくても拾えますが、2本目以降は名言を1本流すごとに1回拾えます。",
          code: "need_throw",
        },
        { status: 402 },
      );
    }

    if (mode === "first") {
      const u = await db.execute({
        sql: `UPDATE sessions SET first_free_used = 1, daily_pick_count = daily_pick_count + 1, jst_day = ?
              WHERE id = ? AND first_free_used = 0 AND daily_pick_count < ?`,
        args: [today, sid, cap],
      });
      if (Number(u.rowsAffected ?? 0) === 0) {
        return NextResponse.json({ error: "混み合っています。もう一度お試しください。", code: "conflict" }, { status: 409 });
      }
    } else {
      const u = await db.execute({
        sql: `UPDATE sessions SET throw_balance = throw_balance - 1, daily_pick_count = daily_pick_count + 1, jst_day = ?
              WHERE id = ? AND throw_balance > 0 AND daily_pick_count < ?`,
        args: [today, sid, cap],
      });
      if (Number(u.rowsAffected ?? 0) === 0) {
        return NextResponse.json({ error: "混み合っています。もう一度お試しください。", code: "conflict" }, { status: 409 });
      }
    }

    const refund = async () => {
      if (mode === "first") {
        await db.execute({
          sql: `UPDATE sessions SET first_free_used = 0,
                daily_pick_count = CASE WHEN daily_pick_count > 0 THEN daily_pick_count - 1 ELSE 0 END
                WHERE id = ?`,
          args: [sid],
        });
      } else {
        await db.execute({
          sql: `UPDATE sessions SET throw_balance = throw_balance + 1,
                daily_pick_count = CASE WHEN daily_pick_count > 0 THEN daily_pick_count - 1 ELSE 0 END
                WHERE id = ?`,
          args: [sid],
        });
      }
    };

    let chosen: DbBottleRow | null = null;

    if (bottleId) {
      const rs = await db.execute({
        sql: "SELECT id, content, genre, createdAt FROM bottles WHERE id = ? AND genre = ?",
        args: [bottleId, genre],
      });
      const hit = rs.rows[0] as Record<string, unknown> | undefined;
      if (hit) {
        chosen = rowToBottle(hit);
      }
    }

    if (!chosen) {
      const rsRand = await db.execute({
        sql: "SELECT id, content, genre, createdAt FROM bottles WHERE genre = ? ORDER BY RANDOM() LIMIT 1",
        args: [genre],
      });
      const first = rsRand.rows[0] as Record<string, unknown> | undefined;
      if (first) {
        chosen = rowToBottle(first);
      }
    }

    if (chosen) {
      await incrementPickedCount(db, chosen.id);
      return NextResponse.json({
        kind: "bottle" as const,
        bottle: {
          id: chosen.id,
          text: chosen.content,
          genre: chosen.genre as WorryGenre,
          createdAt: chosen.createdAt,
          genreLabel: GENRE_LABELS[chosen.genre as WorryGenre] ?? chosen.genre,
        },
      });
    }

    try {
      const sea = await getSeaQuoteForGenres([genre]);
      return NextResponse.json({
        kind: "sea" as const,
        text: sea.text,
        source: sea.source,
        genre,
        genreLabel: GENRE_LABELS[genre],
      });
    } catch (e) {
      console.error(e);
      await refund();
      return NextResponse.json({ error: "海からのことばの生成に失敗しました。" }, { status: 500 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました。" }, { status: 500 });
  }
}
