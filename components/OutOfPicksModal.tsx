"use client";

import { useState } from "react";

type Reason = "daily_exhausted" | "need_throw";

export function OutOfPicksModal({
  open,
  reason,
  message,
  onClose,
  onAfterLogin,
}: {
  open: boolean;
  reason: Reason | null;
  message: string;
  onClose: () => void;
  onAfterLogin: () => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  if (!open) return null;

  async function submitEmail() {
    setHint(null);
    if (!email.trim()) {
      setHint("メールアドレスを入力してください。");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof j === "object" && j !== null && "error" in j && typeof (j as { error?: unknown }).error === "string"
            ? (j as { error: string }).error
            : "保存に失敗しました。";
        setHint(msg);
        return;
      }
      setEmail("");
      onAfterLogin();
      onClose();
    } catch {
      setHint("通信に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-950/95 p-5 shadow-2xl backdrop-blur-md">
        <h2 className="text-lg font-semibold text-white">
          {reason === "daily_exhausted"
            ? "今日の枠はいっぱいです"
            : reason === "need_throw"
              ? "このままでは拾えません"
              : "いまは拾えません"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{message}</p>
        <ul className="mt-3 list-inside list-disc text-xs text-slate-400">
          <li>日本時間 0:00 に、無料枠がリセットされます。</li>
          <li>名言を1本「流す」と、拾えるチャンスが1回ふえます。</li>
          <li>メールでログインすると、1日の上限が +5 回（計10回）になります。</li>
        </ul>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs font-medium text-slate-300">メールで枠を広げる（簡易ログイン）</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
          />
          {hint ? <p className="mt-2 text-xs text-amber-200">{hint}</p> : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void submitEmail()}
            className="mt-3 w-full rounded-lg bg-white/10 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
          >
            {busy ? "送信中…" : "登録して上限を10回に"}
          </button>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            ※本番では認証付きログインに差し替えてください（現状はメール文字列の保存のみ）。
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-white/15 py-2.5 text-sm text-slate-200 hover:bg-white/5"
        >
          とじる
        </button>
      </div>
    </div>
  );
}
