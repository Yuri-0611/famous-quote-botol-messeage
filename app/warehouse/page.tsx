import Link from "next/link";
import { ensureSchema, getTursoClient, isTursoConfigured } from "@/lib/db";
import { assertWarehouseAccess } from "@/lib/warehouse-auth";
import { WarehouseLogoutButton } from "./WarehouseLogoutButton";

export const dynamic = "force-dynamic";

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  return 0;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

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

  let bottles: Array<{
    id: string;
    content: string;
    genre: string;
    createdAt: number;
    picked_count: number;
    author_session_id: string | null;
  }> = [];
  let sessions: Array<{
    id: string;
    throw_balance: number;
    daily_pick_count: number;
    jst_day: string;
    first_free_used: number;
    email: string | null;
  }> = [];
  let pocketItems: Array<{
    id: string;
    session_id: string;
    quote_text: string;
    genre: string;
    kind: string;
    bottle_id: string | null;
    created_at: number;
  }> = [];
  let counts = { bottles: 0, sessions: 0, pocket: 0 };
  let dbError: string | null = null;

  if (!isTursoConfigured()) {
    dbError = "TURSO_DATABASE_URL / TURSO_AUTH_TOKEN が未設定のためデータを読めません。";
  } else {
    try {
      await ensureSchema();
      const db = getTursoClient();

      const cB = await db.execute("SELECT COUNT(*) AS c FROM bottles");
      const cS = await db.execute("SELECT COUNT(*) AS c FROM sessions");
      const cP = await db.execute("SELECT COUNT(*) AS c FROM pocket_items");
      const row0 = (r: unknown) => (r as Record<string, unknown>)?.c;
      counts = {
        bottles: num(row0(cB.rows[0])),
        sessions: num(row0(cS.rows[0])),
        pocket: num(row0(cP.rows[0])),
      };

      const br = await db.execute({
        sql: `SELECT id, content, genre, createdAt, picked_count, author_session_id
              FROM bottles ORDER BY createdAt DESC LIMIT 400`,
        args: [],
      });
      bottles = br.rows.map((x) => {
        const r = x as Record<string, unknown>;
        return {
          id: str(r.id),
          content: str(r.content),
          genre: str(r.genre),
          createdAt: num(r.createdAt),
          picked_count: num(r.picked_count),
          author_session_id: r.author_session_id == null ? null : str(r.author_session_id),
        };
      });

      const sr = await db.execute({
        sql: `SELECT id, throw_balance, daily_pick_count, jst_day, first_free_used, email
              FROM sessions ORDER BY id DESC LIMIT 400`,
        args: [],
      });
      sessions = sr.rows.map((x) => {
        const r = x as Record<string, unknown>;
        return {
          id: str(r.id),
          throw_balance: num(r.throw_balance),
          daily_pick_count: num(r.daily_pick_count),
          jst_day: str(r.jst_day),
          first_free_used: num(r.first_free_used),
          email: r.email == null || str(r.email) === "" ? null : str(r.email),
        };
      });

      const pr = await db.execute({
        sql: `SELECT id, session_id, quote_text, genre, kind, bottle_id, created_at
              FROM pocket_items ORDER BY created_at DESC LIMIT 300`,
        args: [],
      });
      pocketItems = pr.rows.map((x) => {
        const r = x as Record<string, unknown>;
        return {
          id: str(r.id),
          session_id: str(r.session_id),
          quote_text: str(r.quote_text),
          genre: str(r.genre),
          kind: str(r.kind),
          bottle_id: r.bottle_id == null || str(r.bottle_id) === "" ? null : str(r.bottle_id),
          created_at: num(r.created_at),
        };
      });
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
            <p className="mt-1 text-xs text-slate-400">
              ボトル・セッション・ポケットの直近レコードです（一覧は件数上限あり）。
            </p>
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

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">ボトル総数</p>
            <p className="mt-1 text-2xl font-semibold text-white">{counts.bottles}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">セッション総数</p>
            <p className="mt-1 text-2xl font-semibold text-white">{counts.sessions}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">ポケット行総数</p>
            <p className="mt-1 text-2xl font-semibold text-white">{counts.pocket}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-cyan-200/90">ボトル（最新 400）</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[720px] border-collapse text-left text-xs">
              <thead className="bg-black/40 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-2 font-medium">created</th>
                  <th className="p-2 font-medium">genre</th>
                  <th className="p-2 font-medium">picked</th>
                  <th className="p-2 font-medium">author_session</th>
                  <th className="p-2 font-medium">id</th>
                  <th className="p-2 font-medium">content</th>
                </tr>
              </thead>
              <tbody>
                {bottles.map((b) => (
                  <tr key={b.id} className="border-t border-white/5 align-top hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap p-2 font-mono text-slate-400">{formatTs(b.createdAt)}</td>
                    <td className="p-2 text-slate-300">{b.genre}</td>
                    <td className="p-2 font-mono text-slate-300">{b.picked_count}</td>
                    <td className="max-w-[140px] truncate p-2 font-mono text-slate-500" title={b.author_session_id ?? ""}>
                      {b.author_session_id ?? "—"}
                    </td>
                    <td className="max-w-[120px] truncate p-2 font-mono text-slate-500" title={b.id}>
                      {b.id}
                    </td>
                    <td className="p-2 text-slate-200">{b.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bottles.length === 0 && !dbError ? (
              <p className="p-6 text-center text-sm text-slate-500">データがありません。</p>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-cyan-200/90">セッション（最新 400・id 降順）</h2>
          <p className="mb-2 text-xs text-slate-500">メールは個人情報です。共有・スクショに注意してください。</p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[800px] border-collapse text-left text-xs">
              <thead className="bg-black/40 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-2 font-medium">id</th>
                  <th className="p-2 font-medium">email</th>
                  <th className="p-2 font-medium">throw</th>
                  <th className="p-2 font-medium">daily_pick</th>
                  <th className="p-2 font-medium">jst_day</th>
                  <th className="p-2 font-medium">first_free</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-t border-white/5 align-top hover:bg-white/[0.03]">
                    <td className="max-w-[140px] truncate p-2 font-mono text-slate-500" title={s.id}>
                      {s.id}
                    </td>
                    <td className="p-2 text-slate-200">{s.email ?? "—"}</td>
                    <td className="p-2 font-mono text-slate-300">{s.throw_balance}</td>
                    <td className="p-2 font-mono text-slate-300">{s.daily_pick_count}</td>
                    <td className="p-2 font-mono text-slate-400">{s.jst_day || "—"}</td>
                    <td className="p-2 font-mono text-slate-400">{s.first_free_used}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sessions.length === 0 && !dbError ? (
              <p className="p-6 text-center text-sm text-slate-500">データがありません。</p>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-cyan-200/90">ポケット（最新 300）</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead className="bg-black/40 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-2 font-medium">saved</th>
                  <th className="p-2 font-medium">kind</th>
                  <th className="p-2 font-medium">genre</th>
                  <th className="p-2 font-medium">session</th>
                  <th className="p-2 font-medium">bottle_id</th>
                  <th className="p-2 font-medium">quote</th>
                </tr>
              </thead>
              <tbody>
                {pocketItems.map((p) => (
                  <tr key={p.id} className="border-t border-white/5 align-top hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap p-2 font-mono text-slate-400">{formatTs(p.created_at)}</td>
                    <td className="p-2 text-slate-300">{p.kind}</td>
                    <td className="p-2 text-slate-300">{p.genre}</td>
                    <td className="max-w-[120px] truncate p-2 font-mono text-slate-500" title={p.session_id}>
                      {p.session_id}
                    </td>
                    <td className="max-w-[100px] truncate p-2 font-mono text-slate-500" title={p.bottle_id ?? ""}>
                      {p.bottle_id ?? "—"}
                    </td>
                    <td className="p-2 text-slate-200">{p.quote_text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pocketItems.length === 0 && !dbError ? (
              <p className="p-6 text-center text-sm text-slate-500">データがありません。</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
