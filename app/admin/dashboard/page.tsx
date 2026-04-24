import type { Metadata } from "next";
import { count, eq, isNull } from "drizzle-orm";
import { ensureSchema, isTursoConfigured } from "@/lib/db";
import { getDb } from "@/lib/drizzle";
import { GENRE_LABELS, WORRY_GENRES, type WorryGenre } from "@/lib/genres";
import { worries } from "@/lib/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "運営分析ダッシュボード",
  robots: { index: false, follow: false },
};

function genreLabel(key: string): string {
  return (WORRY_GENRES as readonly string[]).includes(key)
    ? GENRE_LABELS[key as WorryGenre]
    : key;
}

export default async function AdminDashboardPage() {
  let dbError: string | null = null;
  let totalWorries = 0;
  let andCount = 0;
  let orCount = 0;
  let unmeasured = 0;
  const topGenres: { key: string; label: string; count: number }[] = [];

  if (!isTursoConfigured()) {
    dbError = "TURSO_DATABASE_URL / TURSO_AUTH_TOKEN が未設定のため集計できません。";
  } else {
    try {
      await ensureSchema();
      const db = getDb();

      const [totalRow] = await db.select({ n: count() }).from(worries);
      const [andRow] = await db.select({ n: count() }).from(worries).where(eq(worries.matchType, "and"));
      const [orRow] = await db.select({ n: count() }).from(worries).where(eq(worries.matchType, "or"));
      const [nullRow] = await db.select({ n: count() }).from(worries).where(isNull(worries.matchType));

      totalWorries = Number(totalRow?.n ?? 0);
      andCount = Number(andRow?.n ?? 0);
      orCount = Number(orRow?.n ?? 0);
      unmeasured = Number(nullRow?.n ?? 0);

      const catRows = await db.select({ category: worries.category }).from(worries);
      const freq = new Map<string, number>();
      for (const r of catRows) {
        for (const part of r.category.split(",")) {
          const k = part.trim();
          if (!k) continue;
          freq.set(k, (freq.get(k) ?? 0) + 1);
        }
      }
      const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      for (const [key, c] of sorted) {
        topGenres.push({ key, label: genreLabel(key), count: c });
      }
    } catch (e) {
      console.error(e);
      dbError = "データベースの読み取りに失敗しました。";
    }
  }

  const recorded = andCount + orCount;
  const andPct = recorded > 0 ? Math.round((andCount / recorded) * 1000) / 10 : 0;
  const orPct = recorded > 0 ? Math.round((orCount / recorded) * 1000) / 10 : 0;
  const maxGenre = topGenres[0]?.count ?? 1;

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 border-b border-zinc-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">internal · analytics</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">運営分析ダッシュボード</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
            悩み別・名言ボトルの利用状況を一覧します。URL を知っている運営者のみアクセスしてください（認証は今後追加予定）。
          </p>
        </header>

        {dbError ? (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {dbError}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">総利用回数</h2>
              <p className="mt-3 text-4xl font-semibold tabular-nums text-zinc-900">{totalWorries}</p>
              <p className="mt-2 text-sm text-zinc-600">worries テーブルの全レコード数</p>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">AND 一致 / OR フォールバック</h2>
              <p className="mt-2 text-sm text-zinc-600">
                計測済み <span className="font-medium text-zinc-800">{recorded}</span> 件のうちの割合（未計測{" "}
                <span className="font-medium tabular-nums text-zinc-800">{unmeasured}</span> 件）
              </p>
              <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-zinc-100">
                {recorded > 0 ? (
                  <>
                    <div
                      className="bg-emerald-500 transition-[width]"
                      style={{ width: `${andPct}%` }}
                      title={`AND ${andPct}%`}
                    />
                    <div
                      className="bg-violet-500 transition-[width]"
                      style={{ width: `${orPct}%` }}
                      title={`OR ${orPct}%`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-zinc-200" />
                )}
              </div>
              <ul className="mt-4 flex flex-wrap gap-6 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                  <span className="text-zinc-700">
                    AND 一致 <strong className="tabular-nums text-zinc-900">{andCount}</strong> 件（{andPct}%）
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-500" aria-hidden />
                  <span className="text-zinc-700">
                    OR フォールバック <strong className="tabular-nums text-zinc-900">{orCount}</strong> 件（{orPct}%）
                  </span>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">人気ジャンル TOP5</h2>
              <p className="mt-2 text-sm text-zinc-600">選択されたカテゴリ（カンマ区切り）を展開して集計</p>
              {topGenres.length === 0 ? (
                <p className="mt-6 text-sm text-zinc-500">まだデータがありません。</p>
              ) : (
                <ol className="mt-6 space-y-4">
                  {topGenres.map((g, i) => (
                    <li key={g.key} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex w-full max-w-xs items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-600">
                          {i + 1}
                        </span>
                        <span className="font-medium text-zinc-900">{g.label}</span>
                        <span className="ml-auto tabular-nums text-sm text-zinc-500 sm:ml-0">{g.count}</span>
                      </div>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${Math.max(8, (g.count / maxGenre) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
