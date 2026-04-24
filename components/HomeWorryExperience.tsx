"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdSlot } from "@/components/AdSlot";
import { BottleGraphic, randomBottleHue, randomBottleVariant } from "@/components/BottleGraphic";
import { GenreSingleSelect } from "@/components/GenreSingleSelect";
import { GENRE_LABELS, type WorryGenre } from "@/lib/genres";

type Step = "form" | "wait" | "result";

type QuotePayload = {
  id: string;
  content: string;
  author: string;
  explanation: string;
  categories: WorryGenre[];
  matchType: "and" | "or";
  requestedCategories: WorryGenre[];
};

export function HomeWorryExperience() {
  const [step, setStep] = useState<Step>("form");
  const [content, setContent] = useState("");
  const [genres, setGenres] = useState<WorryGenre[]>([]);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [waitMs, setWaitMs] = useState(6000);
  const [requestedCategories, setRequestedCategories] = useState<WorryGenre[]>([]);
  const [worryId, setWorryId] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuotePayload | null>(null);
  const [heartOn, setHeartOn] = useState(false);
  const bottleLook = useMemo(
    () => ({ hue: randomBottleHue(), variant: randomBottleVariant() }),
    [],
  );
  const shareBaseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://famous-quote-bottle-message.vercel.app";

  const resetFlow = useCallback(() => {
    setStep("form");
    setContent("");
    setGenres([]);
    setHint(null);
    setRequestedCategories([]);
    setWorryId(null);
    setQuote(null);
    setHeartOn(false);
    setBusy(false);
  }, []);

  async function onSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setHint(null);
    if (genres.length < 1 || genres.length > 2) {
      setHint("ジャンルを1〜2個選んでください。");
      return;
    }
    const t = content.trim();
    if (t.length < 1) {
      setHint("悩みを入力してください。");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/worries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: t, categories: genres }),
      });
      const j: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof j === "object" && j !== null && "error" in j && typeof (j as { error?: unknown }).error === "string"
            ? (j as { error: string }).error
            : "送信に失敗しました。";
        setHint(msg);
        return;
      }
      const cats = (j as { categories?: unknown }).categories;
      if (!Array.isArray(cats)) {
        setHint("応答が不正です。");
        return;
      }
      const validCats = cats.filter((x): x is WorryGenre => typeof x === "string");
      const wid = (j as { worryId?: unknown }).worryId;
      if (typeof wid !== "string" || wid.length < 10) {
        setHint("応答が不正です。");
        return;
      }
      setWorryId(wid);
      setRequestedCategories(validCats);
      setWaitMs(5000 + Math.floor(Math.random() * 3001));
      setStep("wait");
    } catch {
      setHint("通信に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (step !== "wait" || requestedCategories.length < 1 || !worryId) return;
    let cancelled = false;
    const t = setTimeout(() => {
      void (async () => {
        try {
          const q = requestedCategories.map((x) => `category=${encodeURIComponent(x)}`).join("&");
          const res = await fetch(`/api/quotes/random?${q}`);
          const j: unknown = await res.json().catch(() => ({}));
          if (!res.ok) {
            const msg =
              typeof j === "object" && j !== null && "error" in j && typeof (j as { error?: unknown }).error === "string"
                ? (j as { error: string }).error
                : "名言の取得に失敗しました。";
            if (!cancelled) setHint(msg);
            if (!cancelled) setStep("form");
            return;
          }
          const id = (j as { id?: unknown }).id;
          const c = (j as { content?: unknown }).content;
          const a = (j as { author?: unknown }).author;
          const ex = (j as { explanation?: unknown }).explanation;
          const cats = (j as { categories?: unknown }).categories;
          const matchType = (j as { matchType?: unknown }).matchType;
          const requested = (j as { requestedCategories?: unknown }).requestedCategories;
          if (
            typeof id !== "string" ||
            typeof c !== "string" ||
            typeof a !== "string" ||
            typeof ex !== "string" ||
            !Array.isArray(cats) ||
            !Array.isArray(requested) ||
            (matchType !== "and" && matchType !== "or")
          ) {
            if (!cancelled) setHint("応答が不正です。");
            if (!cancelled) setStep("form");
            return;
          }
          const parsedCats = cats.filter((x): x is WorryGenre => typeof x === "string");
          const parsedRequested = requested.filter((x): x is WorryGenre => typeof x === "string");
          if (!cancelled) {
            setQuote({
              id,
              content: c,
              author: a,
              explanation: ex,
              categories: parsedCats,
              matchType,
              requestedCategories: parsedRequested,
            });
            setHeartOn(false);
            setStep("result");
            void fetch("/api/worries/match", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ worryId, matchType }),
            }).catch(() => {});
          }
        } catch {
          if (!cancelled) {
            setHint("通信に失敗しました。");
            setStep("form");
          }
        }
      })();
    }, waitMs);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [step, requestedCategories, waitMs, worryId]);

  return (
    <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-20 pt-10 sm:max-w-xl sm:pt-14">
      <AnimatePresence mode="wait">
        {step === "form" ? (
          <motion.section
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-6"
          >
            <header className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-200/75">worry · quote</p>
              <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                悩み別・名言ボトル
              </h1>
              <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-slate-200/90">
                いまの悩みを海に流すと、同じジャンルの名言が<span className="text-white">ひとつ</span>届きます。何度でも繰り返せます。
              </p>
            </header>

            <form onSubmit={(e) => void onSubmitForm(e)} className="flex flex-col gap-5">
              <label className="block text-sm text-slate-200">
                今の悩み（自由記述）
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="気持ちをそのまま書いてください（個人名・住所などは書かないでください）"
                  className="mt-2 w-full resize-y rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-[15px] leading-relaxed text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/25"
                />
                <span className="mt-1 block text-right text-[10px] text-slate-500">{content.length} / 2000</span>
              </label>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-200">ジャンル（15種・最大2つ）</p>
                <GenreSingleSelect values={genres} onChange={setGenres} disabled={busy} name="worry-genre" />
              </div>

              {hint ? (
                <p className="text-sm text-amber-200" role="alert">
                  {hint}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-900/35 transition hover:from-cyan-300 hover:to-sky-400 disabled:opacity-40"
              >
                {busy ? "流しています…" : "悩みを流す"}
              </button>
            </form>
          </motion.section>
        ) : null}

        {step === "wait" ? (
          <motion.section
            key="wait"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-[60vh] flex-col items-center justify-center gap-8 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <BottleGraphic hue={bottleLook.hue} variant={bottleLook.variant} className="h-28 w-20 opacity-95 drop-shadow-[0_20px_50px_rgba(0,40,80,0.55)]" />
            </motion.div>
            <div>
              <p className="text-lg font-medium text-white">波がボトルを運んでいます…</p>
              <p className="mt-2 text-sm text-slate-400">少しだけ待ってください（約 {Math.round(waitMs / 100) / 10} 秒）</p>
            </div>
            <div className="w-full max-w-md rounded-2xl border border-dashed border-white/20 bg-black/25 p-4">
              <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">ad slot</p>
              <div className="flex min-h-[220px] items-center justify-center rounded-xl bg-black/30">
                <AdSlot slotId="worry-wait" className="w-full justify-center" />
              </div>
            </div>
          </motion.section>
        ) : null}

        {step === "result" && quote ? (
          <motion.section
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-8"
          >
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-black/30 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/85">
                message for you
              </p>
              <p className="mt-4 text-center text-sm leading-relaxed text-slate-100/95">
                {quote.matchType === "and" && quote.requestedCategories.length >= 2
                  ? `あなたが抱える「${GENRE_LABELS[quote.requestedCategories[0]]}」と「${GENRE_LABELS[quote.requestedCategories[1]]}」、その2つの悩みに深く寄り添う言葉です。`
                  : "かつてあなたと同じように悩み、海を眺めた誰かを救った言葉です。"}
              </p>
              <blockquote className="mt-8 border-l-2 border-cyan-400/50 pl-4 text-lg font-medium leading-relaxed text-white sm:text-xl">
                「{quote.content}」
              </blockquote>
              <p className="mt-4 text-right text-sm text-cyan-100/90">— {quote.author}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300/85">{quote.explanation}</p>
              <p className="mt-2 text-center text-xs text-slate-500">
                ジャンル：{quote.categories.map((g) => GENRE_LABELS[g] ?? g).join(" / ")}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setHeartOn((v) => !v)}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold transition",
                  heartOn
                    ? "border-rose-400/60 bg-rose-500/20 text-rose-50"
                    : "border-white/20 bg-white/5 text-white hover:bg-white/10",
                ].join(" ")}
              >
                <span className="text-lg" aria-hidden>
                  {heartOn ? "♥" : "♡"}
                </span>
                心に響いた
              </button>
              {quote ? (
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `私の悩みへのアンサー：『${quote.content}』- ${quote.author} #悩み別名言ボトル #個人開発`,
                  )}&url=${encodeURIComponent(`${shareBaseUrl}/quotes/${quote.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-300/40 bg-sky-400/10 px-6 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/20"
                >
                  <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
                    <path d="M18.901 1.153h3.68l-8.04 9.189 9.458 12.505h-7.406l-5.8-7.584-6.633 7.584H.479l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.933ZM17.61 20.646h2.04L6.486 3.24H4.298L17.61 20.646Z" />
                  </svg>
                  Xでシェア
                </a>
              ) : null}
              <button
                type="button"
                onClick={resetFlow}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-900/30 hover:from-cyan-300 hover:to-sky-400"
              >
                もう一度、別の悩みを流す
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-500">
              この名言のページ：
              <a href={`/quotes/${quote.id}`} className="ml-1 text-cyan-200/90 underline-offset-4 hover:underline">
                開く
              </a>
            </p>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
