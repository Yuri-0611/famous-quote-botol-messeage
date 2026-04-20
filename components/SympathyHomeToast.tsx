"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const LS_ACK = "bq_sympathy_ack_total";

export function SympathyHomeToast() {
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let alive = true;
    void fetch("/api/bottles/sympathy")
      .then((r) => r.json())
      .then((j: unknown) => {
        if (!alive) return;
        const o = j as { totalReach?: unknown; turso?: unknown };
        const totalReach = typeof o.totalReach === "number" ? o.totalReach : 0;
        if (!o.turso) return;
        const prevRaw = typeof window !== "undefined" ? window.localStorage.getItem(LS_ACK) : null;
        const prev = prevRaw !== null && prevRaw !== "" ? Number(prevRaw) : 0;
        if (!Number.isFinite(prev)) return;
        if (totalReach > prev && totalReach > 0) {
          setTotal(totalReach);
          setOpen(true);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_ACK, String(total));
    }
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="pointer-events-auto fixed bottom-6 left-1/2 z-[60] w-[min(92vw,26rem)] -translate-x-1/2 rounded-2xl border border-cyan-200/25 bg-gradient-to-br from-slate-950/95 via-slate-900/92 to-cyan-950/90 px-4 py-3.5 text-center shadow-[0_20px_60px_rgba(0,30,60,0.55)] backdrop-blur-md"
        >
          <p className="text-sm font-medium leading-relaxed text-cyan-50">
            あなたの言葉が、世界のどこかで{" "}
            <span className="text-lg font-semibold tabular-nums text-amber-100">{total}</span>{" "}
            人の力になりました。
          </p>
          <p className="mt-1 text-[11px] text-slate-400">流したボトルが拾われた合計です。</p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 w-full rounded-xl border border-white/15 bg-white/10 py-2 text-xs font-semibold text-white hover:bg-white/15"
          >
            うれしい！（閉じる）
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
