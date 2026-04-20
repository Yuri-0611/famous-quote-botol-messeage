"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { reason?: string };

export function WarehouseLoginForm({ reason }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHint(null);
    setBusy(true);
    try {
      const res = await fetch("/api/warehouse/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof j === "object" && j !== null && "error" in j && typeof (j as { error?: unknown }).error === "string"
            ? (j as { error: string }).error
            : "ログインに失敗しました。";
        setHint(msg);
        return;
      }
      router.push("/warehouse");
      router.refresh();
    } catch {
      setHint("通信に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-16">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
        operator only
      </p>
      <h1 className="mt-2 text-center text-xl font-semibold text-white">運営倉庫ログイン</h1>
      {reason === "unset" ? (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-100">
          サーバーに <span className="font-mono">WAREHOUSE_PASSWORD</span>（8文字以上）を設定してください。
        </p>
      ) : (
        <p className="mt-4 text-center text-xs text-slate-400">
          環境変数 <span className="font-mono text-slate-300">WAREHOUSE_PASSWORD</span> と同じ値を入力します。
        </p>
      )}
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 flex flex-col gap-4">
        <label className="block text-sm text-slate-300">
          パスワード
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2.5 text-slate-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
          />
        </label>
        {hint ? (
          <p className="text-sm text-amber-200" role="status">
            {hint}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || !password}
          className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40"
        >
          {busy ? "確認中…" : "ログイン"}
        </button>
      </form>
      <Link href="/" className="mt-10 text-center text-xs text-cyan-200/80 underline-offset-4 hover:underline">
        トップへ戻る
      </Link>
    </main>
  );
}
