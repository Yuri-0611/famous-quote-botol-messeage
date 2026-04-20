"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/** バズりやすい短いフック（MCPで「提案された」想定のコピー集） */
const HOOKS = [
  "今夜、海があなたにだけ囁く。",
  "誰にも見せない本音を、ボトルに預けよう。",
  "拾った一言が、明日の自分を少しだけ動かす。",
  "スクロールの奨励に、30秒の詩を。",
  "Xでシェアしたくなる夜用の、ささやかな魔法。",
  "ストレスのあとに、波音だけのギャップ時間。",
  "推し活の合間に、匿名のやさしさ。",
  "寝る前のルーティンに、ランダムな勇気を。",
] as const;

export function BuzzRibbon() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setI((v) => (v + 1) % HOOKS.length);
    }, 5200);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-indigo-500/10 px-4 py-3 text-center shadow-[0_0_40px_rgba(34,211,238,0.12)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-100/80">
        TONIGHT HOOK
      </p>
      <div className="relative mt-1 min-h-[2.75rem]">
        <AnimatePresence mode="wait">
          <motion.p
            key={HOOKS[i]}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45 }}
            className="text-sm font-medium leading-snug text-white"
          >
            {HOOKS[i]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
