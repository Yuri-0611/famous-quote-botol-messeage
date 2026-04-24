import Link from "next/link";
import { count, desc } from "drizzle-orm";
import { ensureSchema, isTursoConfigured } from "@/lib/db";
import { getDb } from "@/lib/drizzle";
import { assertWarehouseAccess } from "@/lib/warehouse-auth";
import { quotes, worries } from "@/lib/schema";
import { WarehouseLogoutButton } from "./WarehouseLogoutButton";

export const dynamic = "force-dynamic";

function formatTs(ms: number): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toISOString();
  } catch {
    return String(ms);
  }
}

export default async function WarehousePage() {
  await assertWarehouseAccess();

  let worryRows: Array<{ id: string; content: string; category: string; createdAt: number }> = [];
  let quoteRows: Array<{ id: string; content: string; author: string; category: string; createdAt: number }> = [];
  let counts = { worries: 0, quotes: 0 };
  let dbError: string | null = null;

  if (!isTursoConfigured()) {
    dbError = "TURSO_DATABASE_URL / TURSO_AUTH_TOKEN が未設定のためデータを読めません。";
  } else {
    try {
      await ensureSchema();
      const db = getDb();

      const [wCountRow] = await db.select({ n: count() }).from(worries);
      const [qCountRow] = await db.select({ n: count() }).from(quotes);
      counts = {
        worries: Number(wCountRow?.n ?? 0),
        quotes: Number(qCountRow?.n ?? 0),
      };

      const wList = await db.select().from(worries).orderBy(desc(worries.createdAt)).limit(400);
      const qList = await db.select().from(quotes).orderBy(desc(quotes.createdAt)).limit(400);

      worryRows = wList.map((r) => ({
        id: r.id,
        content: r.content,
        category: r.category,
        createdAt: r.createdAt,
      }));
      quoteRows = qList.map((r) => ({
        id: r.id,
        content: r.content,
        author: r.author,
        category: r.category,
        createdAt: r.createdAt,
      }));
    } catch (e) {
      console.error(e);
      dbError = e instanceof Error ? e.message : "データベース読み取りに失敗しました。";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">warehouse</p>
            <h1 className="text-lg font-semibold text-white">運営データ倉庫</h1>
            <p className="mt-1 text-xs text-slate-400">worries（悩み）と quotes（名言）の直近レコードです。</p>
          </div>
          <div className="flex items-center gap-2">
            <WarehouseLogoutButton />
            <Link
              href="/"
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/20"
            >
              トップ
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
        {dbError ? (
          <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{dbError}</p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">worries 件数</p>
            <p className="mt-1 text-2xl font-semibold text-white">{counts.worries}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">quotes 件数</p>
            <p className="mt-1 text-2xl font-semibold text-white">{counts.quotes}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-cyan-200/90">worries（最新 400）</h2>
          <p className="mb-2 text-xs text-slate-500">個人情報が含まれないよう運営側で扱ってください。</p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[720px] border-collapse text-left text-xs">
              <thead className="bg-black/40 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-2 font-medium">created</th>
                  <th className="p-2 font-medium">category</th>
                  <th className="p-2 font-medium">id</th>
                  <th className="p-2 font-medium">content</th>
                </tr>
              </thead>
              <tbody>
                {worryRows.map((w) => (
                  <tr key={w.id} className="border-t border-white/5 align-top hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap p-2 font-mono text-slate-400">{formatTs(w.createdAt)}</td>
                    <td className="p-2 text-slate-300">{w.category}</td>
                    <td className="max-w-[120px] truncate p-2 font-mono text-slate-500" title={w.id}>
                      {w.id}
                    </td>
                    <td className="p-2 text-slate-200">{w.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {worryRows.length === 0 && !dbError ? (
              <p className="p-6 text-center text-sm text-slate-500">データがありません。</p>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-cyan-200/90">quotes（最新 400）</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead className="bg-black/40 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-2 font-medium">created</th>
                  <th className="p-2 font-medium">category</th>
                  <th className="p-2 font-medium">author</th>
                  <th className="p-2 font-medium">id</th>
                  <th className="p-2 font-medium">content</th>
                </tr>
              </thead>
              <tbody>
                {quoteRows.map((q) => (
                  <tr key={q.id} className="border-t border-white/5 align-top hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap p-2 font-mono text-slate-400">{formatTs(q.createdAt)}</td>
                    <td className="p-2 text-slate-300">{q.category}</td>
                    <td className="p-2 text-slate-300">{q.author}</td>
                    <td className="max-w-[120px] truncate p-2 font-mono text-slate-500" title={q.id}>
                      {q.id}
                    </td>
                    <td className="p-2 text-slate-200">{q.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {quoteRows.length === 0 && !dbError ? (
              <p className="p-6 text-center text-sm text-slate-500">データがありません。`npm run seed-quotes` を実行してください。</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
