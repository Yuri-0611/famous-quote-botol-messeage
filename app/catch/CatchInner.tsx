"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BottleGraphic,
  type BottleHue,
  type BottleVariant,
  bottleVariantFromIndex,
  randomBottleHue,
} from "@/components/BottleGraphic";
import { GenreSingleSelect } from "@/components/GenreSingleSelect";
import { OutOfPicksModal } from "@/components/OutOfPicksModal";
import { RippleBurst } from "@/components/RippleBurst";
import { GENRE_LABELS, type WorryGenre } from "@/lib/genres";
import { playPickSplash } from "@/lib/sounds/playPickSplash";
import { saveLocalPocketItem } from "@/lib/pocket-local";
import { buildXIntentUrl } from "@/lib/share-x";

type Step = "shore" | "choose" | "reach" | "result";

type PickBottle = {
  id: string;
  text: string;
  genre: WorryGenre;
  createdAt: number;
  genreLabel: string;
};

type PickResult =
  | { kind: "bottle"; bottle: PickBottle }
  | { kind: "sea"; text: string; source: "openai" | "fallback"; genre: WorryGenre; genreLabel: string };

type Quota = {
  throwBalance: number;
  dailyUsed: number;
  dailyCap: number;
  picksRemainingToday: number;
  firstFreeAvailable: boolean;
  hasEmail: boolean;
  jstToday: string;
};

function parseQuota(j: unknown): Quota | null {
  if (typeof j !== "object" || j === null) return null;
  const o = j as Record<string, unknown>;
  return {
    throwBalance: typeof o.throwBalance === "number" ? o.throwBalance : 0,
    dailyUsed: typeof o.dailyUsed === "number" ? o.dailyUsed : 0,
    dailyCap: typeof o.dailyCap === "number" ? o.dailyCap : 5,
    picksRemainingToday: typeof o.picksRemainingToday === "number" ? o.picksRemainingToday : 0,
    firstFreeAvailable: Boolean(o.firstFreeAvailable),
    hasEmail: Boolean(o.hasEmail),
    jstToday: typeof o.jstToday === "string" ? o.jstToday : "",
  };
}

export function CatchInner() {
  const searchParams = useSearchParams();
  const fromThrow = searchParams.get("from") === "throw";

  const [step, setStep] = useState<Step>(fromThrow ? "choose" : "shore");
  const [genre, setGenre] = useState<WorryGenre | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [dbOk, setDbOk] = useState<boolean | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [shoreSlots, setShoreSlots] = useState<
    Array<{ key: string; bottleId: string | null; hue: BottleHue; variant: BottleVariant; x: number }>
  >([]);
  const [shoreLoading, setShoreLoading] = useState(false);
  const [result, setResult] = useState<PickResult | null>(null);
  const [ripple, setRipple] = useState(false);
  const [resultHue, setResultHue] = useState<BottleHue | null>(null);
  const [resultVariant, setResultVariant] = useState<BottleVariant | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReason, setModalReason] = useState<"daily_exhausted" | "need_throw" | null>(null);
  const [modalMessage, setModalMessage] = useState("");
  const [pocketBusy, setPocketBusy] = useState(false);
  const [pocketHint, setPocketHint] = useState<string | null>(null);

  const quoteText = useMemo(() => {
    if (!result) return "";
    return result.kind === "bottle" ? result.bottle.text : result.text;
  }, [result]);

  const shareUrl = useMemo(() => {
    if (!quoteText || typeof window === "undefined" || !result) return "";
    const origin = window.location.origin;
    const canonical =
      result.kind === "bottle"
        ? `${origin}/quotes/${result.bottle.id}`
        : `${origin}/share?q=${encodeURIComponent(quoteText.slice(0, 700))}`;
    return buildXIntentUrl(quoteText, origin, canonical);
  }, [quoteText, result]);

  async function refreshCredits() {
    try {
      const r = await fetch("/api/bottles/credits");
      const j: unknown = await r.json();
      const q = parseQuota(j);
      setQuota(q);
    } catch {
      setQuota(null);
    }
  }

  useEffect(() => {
    void fetch("/api/health")
      .then((r) => r.json())
      .then((j) => setDbOk(Boolean(j?.turso && j?.ok)))
      .catch(() => setDbOk(false));
    void refreshCredits();
  }, []);

  useEffect(() => {
    if (step !== "reach" || !genre) return;
    let alive = true;
    setShoreLoading(true);
    setShoreSlots([]);
    void fetch("/api/bottles/shore-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genre }),
    })
      .then(async (r) => {
        const j: unknown = await r.json().catch(() => ({}));
        if (!alive) return;
        const ids =
          typeof j === "object" && j !== null && Array.isArray((j as { ids?: unknown }).ids)
            ? (j as { ids: unknown[] }).ids.filter((x): x is string => typeof x === "string")
            : [];
        const xs = [7, 26, 50, 74, 92];
        setShoreSlots(
          xs.map((x, i) => ({
            key: `slot-${i}-${genre}`,
            bottleId: i < ids.length ? ids[i]! : null,
            hue: randomBottleHue(),
            variant: bottleVariantFromIndex(i),
            x,
          })),
        );
      })
      .catch(() => {
        if (!alive) return;
        const xs = [7, 26, 50, 74, 92];
        setShoreSlots(
          xs.map((x, i) => ({
            key: `slot-${i}-fallback`,
            bottleId: null,
            hue: randomBottleHue(),
            variant: bottleVariantFromIndex(i),
            x,
          })),
        );
      })
      .finally(() => {
        if (alive) setShoreLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [step, genre]);

  async function onPickConfirm(bottleId: string | null, hue: BottleHue, variant: BottleVariant) {
    if (!genre) {
      setHint("ジャンルを1つ選んでください。");
      return;
    }
    setHint(null);
    setPicking(true);
    setResult(null);
    try {
      const res = await fetch("/api/bottles/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          bottleId ? { genre, bottleId } : { genre },
        ),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "拾えませんでした。";
        const codeRaw =
          typeof data === "object" && data !== null && "code" in data
            ? (data as { code?: unknown }).code
            : undefined;
        const code = typeof codeRaw === "string" ? codeRaw : "";
        setHint(msg);
        if (res.status === 402) {
          setModalReason(code === "daily_exhausted" ? "daily_exhausted" : "need_throw");
          setModalMessage(msg);
          setModalOpen(true);
        }
        setPicking(false);
        return;
      }
      playPickSplash();
      setResultHue(hue);
      setResultVariant(variant);
      setRipple(true);
      window.setTimeout(() => setRipple(false), 1000);

      if (
        typeof data === "object" &&
        data !== null &&
        "kind" in data &&
        (data as { kind?: unknown }).kind === "bottle" &&
        "bottle" in data
      ) {
        const b = (data as { bottle: PickBottle }).bottle;
        setResult({ kind: "bottle", bottle: b });
      } else if (
        typeof data === "object" &&
        data !== null &&
        "kind" in data &&
        (data as { kind?: unknown }).kind === "sea" &&
        "text" in data
      ) {
        const d = data as unknown as {
          text: string;
          source: "openai" | "fallback";
          genre: WorryGenre;
          genreLabel?: string;
        };
        setResult({
          kind: "sea",
          text: d.text,
          source: d.source,
          genre: d.genre,
          genreLabel: d.genreLabel ?? GENRE_LABELS[d.genre],
        });
      } else {
        setHint("想定外の応答です。");
        setPicking(false);
        return;
      }
      await refreshCredits();
      setStep("result");
    } catch {
      setHint("通信に失敗しました。");
    } finally {
      setPicking(false);
    }
  }

  function restartFlow() {
    setStep("shore");
    setGenre(null);
    setResult(null);
    setHint(null);
    setResultHue(null);
    setResultVariant(null);
    setShoreSlots([]);
    setShoreLoading(false);
    setPocketHint(null);
    void refreshCredits();
  }

  async function saveToPocket() {
    if (!result) return;
    setPocketBusy(true);
    setPocketHint(null);
    const text = quoteText;
    const genreSave = result.kind === "bottle" ? result.bottle.genre : result.genre;
    const kind = result.kind === "bottle" ? "bottle" : "sea";
    const bottleId = result.kind === "bottle" ? result.bottle.id : null;
    try {
      if (quota?.hasEmail) {
        const res = await fetch("/api/pocket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            genre: genreSave,
            kind,
            ...(bottleId ? { bottleId } : {}),
          }),
        });
        const j: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            typeof j === "object" &&
            j !== null &&
            "error" in j &&
            typeof (j as { error?: unknown }).error === "string"
              ? (j as { error: string }).error
              : "保存に失敗しました。";
          setPocketHint(msg);
          return;
        }
        setPocketHint("マイ・ポケット（クラウド）に保存しました。");
      } else {
        saveLocalPocketItem({ quoteText: text, genre: genreSave, kind, bottleId });
        setPocketHint("マイ・ポケット（この端末）に保存しました。トップの「マイ・ポケット」からいつでも見返せます。");
      }
    } catch {
      setPocketHint("通信に失敗しました。");
    } finally {
      setPocketBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-24 pt-8 sm:max-w-xl sm:pt-12">
      <OutOfPicksModal
        open={modalOpen}
        reason={modalReason}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
        onAfterLogin={() => void refreshCredits()}
      />

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
          STEP 2 / 拾う
        </span>
      </div>

      <div className="mb-6 grid gap-2 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-slate-200 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">今日の残り（無料枠）</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-cyan-100">
            {quota ? `${quota.picksRemainingToday} / ${quota.dailyCap}` : "—"}
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            JST 0:00 でリセット · {quota?.hasEmail ? "ログイン済（上限10）" : "未ログイン（上限5）"}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">流したボトル分</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-sky-100">{quota?.throwBalance ?? "—"}</div>
          <div className="mt-1 text-[10px] text-slate-500">
            {quota?.firstFreeAvailable ? "初回お試し：流さずに1本拾えます" : "2本目以降は1本流すごとに1回"}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "shore" ? (
          <motion.section
            key="shore"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-5"
          >
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">波打ち際へ</h1>
            <p className="text-sm leading-relaxed text-slate-300">
              まずは足元の砂を感じて。少しずつ、拾いにいく準備をしていきましょう。
            </p>
            <motion.div
              className="flex justify-center py-6"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <BottleGraphic variant={bottleVariantFromIndex(2)} className="h-24 w-16 opacity-90" />
            </motion.div>
            <button
              type="button"
              onClick={() => setStep("choose")}
              className="w-full rounded-2xl border border-white/25 bg-white/10 py-3.5 text-sm font-semibold text-white hover:bg-white/15"
            >
              次へ：悩みのジャンルを選ぶ
            </button>
          </motion.section>
        ) : null}

        {step === "choose" ? (
          <motion.section
            key="choose"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">いまの悩みに近いジャンル</h1>
            <p className="mt-2 text-sm text-slate-300">
              次の画面で、浜辺に並んだボトルから一本をタップして拾います。
            </p>
            <div className="mt-5">
              <GenreSingleSelect value={genre} onChange={setGenre} name="拾うジャンル" disabled={picking} />
            </div>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("shore")}
                className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-slate-200 hover:bg-black/40"
              >
                戻る
              </button>
              <button
                type="button"
                disabled={!genre}
                onClick={() => setStep("reach")}
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40"
              >
                次へ：浜辺へ
              </button>
            </div>
          </motion.section>
        ) : null}

        {step === "reach" ? (
          <motion.section
            key="reach"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.45 }}
          >
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">浜辺のボトルから一本</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              波が引いて、月明かりの砂の上にボトルがいくつか残っています。拾いたい一本をタップしてください。
            </p>

            <div className="relative my-8 min-h-[260px] overflow-hidden rounded-3xl border border-amber-200/25 bg-slate-950/40 shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(16,20,30,0.96) 0%, rgba(38,34,28,0.9) 34%, rgba(72,60,44,0.92) 68%, rgba(92,78,56,0.98) 92%, rgba(76,64,48,1) 100%)",
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.16]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 18% 72%, rgba(255,252,230,0.55) 0.6px, transparent 1.2px), radial-gradient(circle at 55% 82%, rgba(255,248,220,0.45) 0.5px, transparent 1px), radial-gradient(circle at 82% 68%, rgba(255,255,250,0.4) 0.5px, transparent 1px)",
                  backgroundSize: "26px 22px, 34px 28px, 20px 24px",
                }}
              />
              <svg
                className="shore-wave-layer-1 pointer-events-none absolute -bottom-2 -left-[18%] h-[42%] w-[136%] text-cyan-500/25"
                viewBox="0 0 900 100"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  fill="currentColor"
                  d="M0 52 C120 28 240 72 360 48 S600 24 720 50 S880 36 900 44 L900 120 L0 120 Z"
                />
              </svg>
              <svg
                className="shore-wave-layer-2 pointer-events-none absolute -bottom-3 -left-[8%] h-[38%] w-[118%] text-sky-400/20"
                viewBox="0 0 900 100"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  fill="currentColor"
                  d="M0 58 C140 36 280 78 420 52 S680 30 820 56 S900 44 900 50 L900 120 L0 120 Z"
                />
              </svg>
              <svg
                className="shore-wave-layer-3 shore-foam-shimmer pointer-events-none absolute -bottom-1 -left-[12%] h-[32%] w-[124%] text-white/14"
                viewBox="0 0 900 90"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  fill="currentColor"
                  d="M0 48 C100 38 200 58 300 44 S500 32 600 46 S780 34 900 42 L900 100 L0 100 Z"
                />
              </svg>
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-cyan-950/45 via-slate-900/15 to-transparent"
                animate={{ opacity: [0.45, 0.72, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-slate-950/50 to-transparent" />

              <div className="relative z-10 p-4">
                <RippleBurst active={ripple} />

                {shoreLoading ? (
                  <div className="flex h-[220px] items-end justify-between px-2 pb-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="h-24 w-14 rounded-2xl bg-amber-100/10"
                        animate={{ opacity: [0.35, 0.75, 0.35], y: [0, -6, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.12 }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="relative h-[220px]">
                    {shoreSlots.map((s, idx) => (
                      <motion.button
                        key={s.key}
                        type="button"
                        disabled={picking}
                        aria-label={`ボトルを拾う（${idx + 1}本目）`}
                        onClick={() => void onPickConfirm(s.bottleId, s.hue, s.variant)}
                        className="absolute bottom-2 w-24 -translate-x-1/2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-100/80 disabled:opacity-40 sm:w-28"
                        style={{ left: `${s.x}%` }}
                        initial={{ opacity: 0, y: 48, rotate: -6 }}
                        animate={{ opacity: 1, y: 0, rotate: idx % 2 === 0 ? -4 : 4 }}
                        transition={{ type: "spring", stiffness: 420, damping: 22, delay: idx * 0.08 }}
                        whileHover={{ scale: 1.08, y: -4 }}
                        whileTap={{ scale: 0.94 }}
                      >
                        <div className="relative drop-shadow-[0_16px_36px_rgba(0,20,45,0.55)]">
                          <BottleGraphic
                            hue={s.hue}
                            variant={s.variant}
                            className="mx-auto h-28 w-20 sm:h-32 sm:w-24"
                          />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {hint ? (
              <p className="mb-3 text-sm text-amber-200" role="status">
                {hint}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-slate-200 hover:bg-black/40"
              >
                戻る
              </button>
              <p className="flex flex-1 items-center justify-center text-center text-xs text-slate-400">
                {picking ? "波の音が大きくなる…" : "一本をタップすると中身が開きます。"}
              </p>
            </div>
          </motion.section>
        ) : null}

        {step === "result" && result ? (
          <motion.section
            key="result"
            initial={{ opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="flex flex-col gap-5"
          >
            <p className="text-center text-sm font-semibold text-cyan-100">今の自分にぴったりの言葉が届いた！</p>
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/30 p-5 shadow-inner shadow-black/40">
              <RippleBurst active={ripple} />
              <div className="relative flex flex-col items-center gap-3">
                {resultHue ? (
                  <BottleGraphic
                    hue={resultHue}
                    variant={resultVariant ?? bottleVariantFromIndex(0)}
                    className="h-16 w-11 opacity-95"
                  />
                ) : null}
                <p className="text-pretty text-center text-lg font-medium leading-relaxed text-white sm:text-xl">
                  「{quoteText}」
                </p>
              </div>
              <p className="relative mt-4 text-xs text-slate-400">
                {result.kind === "bottle" ? (
                  <>
                    漂流ボトル · ジャンル：
                    <span className="text-slate-200">{result.bottle.genreLabel}</span>
                  </>
                ) : (
                  <>
                    海が紡いだ言葉（{result.source === "openai" ? "AI" : "オフライン"}）· ジャンル：
                    <span className="text-slate-200">{result.genreLabel}</span>
                  </>
                )}
              </p>
            </div>

            <button
              type="button"
              disabled={pocketBusy}
              onClick={() => void saveToPocket()}
              className="w-full rounded-2xl border border-amber-200/30 bg-gradient-to-r from-amber-500/15 to-orange-400/10 py-3.5 text-sm font-semibold text-amber-50/95 shadow-inner shadow-amber-900/20 hover:from-amber-500/25 hover:to-orange-400/15 disabled:opacity-50"
            >
              {pocketBusy ? "保存中…" : "この言葉をポケットに保存する"}
            </button>
            {pocketHint ? (
              <p className="text-center text-xs leading-relaxed text-slate-300" role="status">
                {pocketHint}
              </p>
            ) : null}

            {shareUrl ? (
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3.5 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-zinc-900"
              >
                <span aria-hidden>𝕏</span>
                この名言を X でシェア
              </a>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/throw"
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 py-3 text-sm font-semibold text-slate-950"
              >
                もう一本、流す
              </Link>
              <button
                type="button"
                onClick={restartFlow}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/20 bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                もう一度、拾いにいく
              </button>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
