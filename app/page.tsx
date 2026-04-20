"use client";

import Link from "next/link";
import { useState } from "react";
import { BuzzRibbon } from "@/components/BuzzRibbon";
import { BottleGraphic, randomBottleHue, randomBottleVariant } from "@/components/BottleGraphic";
import { MyPocketPanel } from "@/components/MyPocketPanel";
import { SympathyHomeToast } from "@/components/SympathyHomeToast";
import { motion } from "framer-motion";

export default function HomePage() {
  const [heroBottle] = useState(() => ({
    hue: randomBottleHue(),
    variant: randomBottleVariant(),
  }));
  const [pocketOpen, setPocketOpen] = useState(false);

  return (
    <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-16 pt-10 sm:max-w-2xl sm:pt-16">
      <SympathyHomeToast />
      <MyPocketPanel open={pocketOpen} onClose={() => setPocketOpen(false)} />
      <div className="absolute right-2 top-2 z-[20] sm:right-0 sm:top-0">
        <button
          type="button"
          onClick={() => setPocketOpen(true)}
          className="flex items-center gap-2 rounded-full border border-amber-200/25 bg-black/35 px-3 py-1.5 text-[11px] font-semibold text-amber-50/95 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm hover:bg-black/45"
        >
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300/50 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-200/90" />
          </span>
          マイ・ポケット
        </button>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="flex flex-col items-center text-center"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="mb-4"
        >
          <BottleGraphic
            hue={heroBottle.hue}
            variant={heroBottle.variant}
            className="h-24 w-16 opacity-95 drop-shadow-[0_20px_50px_rgba(0,40,80,0.55)]"
          />
        </motion.div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-200/75">
          drift bottle · Turso sea
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          悩み別・名言ボトル
        </h1>
        <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-slate-200/90 sm:text-base">
          まず浜辺から<strong className="text-white">言葉を流す</strong>。
          そのあとで<strong className="text-white">波打ち際へ向かい</strong>、ボトルを拾いにいきます。
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.55 }}
        className="mt-8"
      >
        <BuzzRibbon />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.55 }}
        className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center"
      >
        <Link
          href="/throw"
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-900/35 transition hover:from-cyan-300 hover:to-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          ① 言葉を流す（投げる）
        </Link>
        <Link
          href="/catch"
          className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-6 py-4 text-base font-semibold text-white shadow-inner shadow-white/5 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          ② 拾いにいく
        </Link>
      </motion.div>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-500">
        初回は流さなくても1本だけ拾えます。2本目以降は名言を1本流すごとに1回拾えます。
        <br />
        1日の無料枠は日本時間0:00にリセット（未ログイン5回／メール登録で10回）。
        <br />
        データは Turso（libSQL）に保存されます。
      </p>
    </main>
  );
}
