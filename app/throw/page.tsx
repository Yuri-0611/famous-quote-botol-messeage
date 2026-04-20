"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BottleGraphic, randomBottleHue, randomBottleVariant } from "@/components/BottleGraphic";
import { GenreSingleSelect } from "@/components/GenreSingleSelect";
import type { WorryGenre } from "@/lib/genres";
import { playThrowWhoosh } from "@/lib/sounds/playThrowWhoosh";

const FLY_MS = 3100;

export default function ThrowPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [genre, setGenre] = useState<WorryGenre | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flying, setFlying] = useState(false);
  const [flyKey, setFlyKey] = useState(0);
  const [dbOk, setDbOk] = useState<boolean | null>(null);
  const [quotaLine, setQuotaLine] = useState<string | null>(null);
  const [bottleLook] = useState(() => ({
    hue: randomBottleHue(),
    variant: randomBottleVariant(),
  }));
  const quoteInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void fetch("/api/health")
      .then((r) => r.json())
      .then((j) => setDbOk(Boolean(j?.turso && j?.ok)))
      .catch(() => setDbOk(false));
    void fetch("/api/bottles/credits")
      .then((r) => r.json())
      .then((j) => {
        if (typeof j !== "object" || j === null) return;
        const o = j as Record<string, unknown>;
        const rem = typeof o.picksRemainingToday === "number" ? o.picksRemainingToday : null;
        const cap = typeof o.dailyCap === "number" ? o.dailyCap : null;
        const tb = typeof o.throwBalance === "number" ? o.throwBalance : null;
        const ff = Boolean(o.firstFreeAvailable);
        if (rem !== null && cap !== null && tb !== null) {
          setQuotaLine(
            `今日の無料枠：残り ${rem}/${cap} 回 · 流した分：${tb} 回 · ${ff ? "初回お試しあり" : "初回お試し済"}`,
          );
        }
      })
      .catch(() => setQuotaLine(null));
  }, []);

  const ready = Boolean(text.trim() && genre) && !busy && !flying;

  async function onSubmit() {
    if (!genre || !text.trim()) {
      setHint("名言とジャンルを選んでください。");
      return;
    }
    setHint(null);
    setBusy(true);
    try {
      const res = await fetch("/api/bottles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), genre }),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "送信に失敗しました。";
        const hintExtra =
          typeof data === "object" &&
          data !== null &&
          "hint" in data &&
          typeof (data as { hint?: unknown }).hint === "string"
            ? (data as { hint: string }).hint.trim()
            : "";
        setHint(
          hintExtra && res.status === 422
            ? `${msg}\n\n（参考）${hintExtra}`
            : msg,
        );
        setBusy(false);
        window.requestAnimationFrame(() => {
          quoteInputRef.current?.focus();
        });
        return;
      }
      playThrowWhoosh();
      setFlying(true);
      setFlyKey((k) => k + 1);
      window.setTimeout(() => {
        setFlying(false);
        setBusy(false);
        router.push("/catch?from=throw");
      }, FLY_MS);
    } catch {
      setHint("通信に失敗しました。ネットワークを確認してください。");
      setBusy(false);
      window.requestAnimationFrame(() => {
        quoteInputRef.current?.focus();
      });
    }
  }

  return (
    <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-20 pt-8 sm:max-w-xl sm:pt-12">
      {dbOk === false ? (
        <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-100">
          データベースに接続できません。`.env.local` の TURSO_DATABASE_URL / TURSO_AUTH_TOKEN を確認してください。
        </p>
      ) : null}

      <div className="mb-4 flex items-center justify-between gap-2 text-xs text-slate-400">
        <Link href="/" className="text-cyan-200/90 underline-offset-4 hover:underline">
          ← トップへ
        </Link>
        <span className="rounded-full border border-white/15 bg-black/30 px-2 py-1 text-[10px] text-slate-300">
          STEP 1 / 投げる
        </span>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold text-white sm:text-3xl"
      >
        浜辺から、ボトルを海へ
      </motion.h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        ボトルに入れた言葉は、Turso の海に保存されます。1本流すごとに「拾うためのチケット」が1枚ふえます（2本目以降の拾う回に使用）。
      </p>
      {quotaLine ? (
        <p className="mt-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[11px] leading-relaxed text-slate-300">
          {quotaLine}
        </p>
      ) : null}

      <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-cyan-950/30 p-5">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl"
          animate={{ opacity: [0.25, 0.55, 0.3], scale: [1, 1.08, 1] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative flex items-end justify-center gap-6">
          <p className="max-w-[150px] text-[11px] leading-relaxed text-slate-400">
            月明かりの砂。ここからボトルが滑り、水平線の向こうへ。
          </p>
          <motion.div
            animate={{ y: [0, -5, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <BottleGraphic
              hue={bottleLook.hue}
              variant={bottleLook.variant}
              className="h-20 w-14 opacity-95 drop-shadow-lg"
            />
          </motion.div>
        </div>
      </div>

      <label htmlFor="q" className="mt-8 block text-sm font-medium text-slate-200">
        名言・格言
      </label>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
        本文に氏名・住所・連絡先などの<strong className="text-slate-400">個人情報は入れないでください</strong>（
        <Link href="/terms#posting-no-pii" className="text-cyan-200/85 underline-offset-2 hover:underline">
          利用規約
        </Link>
        ）。
      </p>
      <textarea
        ref={quoteInputRef}
        id="q"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={busy || flying}
        rows={5}
        placeholder="例：小さな一歩が、いちばん確かな一歩だ。"
        className="mt-2 w-full resize-y rounded-xl border border-white/20 bg-black/30 px-3 py-3 text-[15px] leading-relaxed text-slate-50 placeholder:text-slate-500 focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 disabled:opacity-50"
      />

      <p className="mt-6 text-sm font-medium text-slate-200">届けたい悩みのジャンル（1つ）</p>
      <div className="mt-2">
        <GenreSingleSelect
          value={genre}
          onChange={setGenre}
          disabled={busy || flying}
          name="送るジャンル"
        />
      </div>

      {hint ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-amber-200" role="status">
          {hint}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={!ready}
        className="mt-8 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-900/35 transition hover:from-cyan-300 hover:to-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {flying ? "海へ向かっています…" : busy ? "送信中…" : "このボトルを海に流す"}
      </button>

      <AnimatePresence>
        {flying ? (
          <motion.div
            key={flyKey}
            className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-end pb-[10vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="throw-wave-bump absolute inset-x-0 bottom-0 h-[28vh] bg-gradient-to-t from-cyan-400/25 via-sky-500/10 to-transparent" />
            <motion.div
              aria-hidden
              className="absolute bottom-[6vh] left-[10%] h-24 w-24 rounded-full border border-white/15 bg-white/5 blur-[1px]"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.45, 0], scale: [0.6, 2.4, 3.2] }}
              transition={{ duration: 2.4, ease: "easeOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute bottom-[8vh] right-[12%] h-16 w-16 rounded-full border border-cyan-200/20 bg-cyan-200/10"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.35, 0], scale: [0.5, 2.1, 2.8] }}
              transition={{ duration: 2.1, ease: "easeOut", delay: 0.12 }}
            />
            <p className="relative z-[1] mb-4 text-center text-xs text-sky-100/90">
              波音が大きくなり、ボトルが夜の水平線へ溶けていきます…
            </p>
            <div className="relative z-[1] bottle-fly drop-shadow-[0_26px_60px_rgba(0,30,60,0.6)]">
              <motion.div
                animate={{ rotate: [-2, 6, -4, 3, 0] }}
                transition={{ duration: 3.1, ease: "easeInOut" }}
              >
                <BottleGraphic hue={bottleLook.hue} variant={bottleLook.variant} className="h-36 w-24 sm:h-44 sm:w-32" />
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
