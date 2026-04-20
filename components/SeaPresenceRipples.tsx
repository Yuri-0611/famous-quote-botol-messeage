"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

type Ripple = { id: string; leftPct: number; topPct: number; size: number };

export function SeaPresenceRipples() {
  const reduce = useReducedMotion();
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const spawn = useCallback(() => {
    if (reduce) return;
    const id = crypto.randomUUID();
    const leftPct = 8 + Math.random() * 84;
    const topPct = 18 + Math.random() * 62;
    const size = 56 + Math.random() * 120;
    setRipples((r) => [...r.slice(-6), { id, leftPct, topPct, size }]);
    window.setTimeout(() => {
      setRipples((r) => r.filter((x) => x.id !== id));
    }, 3200);
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    spawn();
    const id = window.setInterval(() => spawn(), 3200 + Math.floor(Math.random() * 1800));
    return () => window.clearInterval(id);
  }, [reduce, spawn]);

  if (reduce) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.div
            key={r.id}
            className="absolute rounded-full border border-cyan-200/25 bg-gradient-to-br from-cyan-300/12 to-sky-400/5 shadow-[0_0_40px_rgba(120,200,255,0.15)]"
            style={{
              left: `${r.leftPct}%`,
              top: `${r.topPct}%`,
              width: r.size,
              height: r.size,
              marginLeft: -r.size / 2,
              marginTop: -r.size / 2,
            }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 2.4, opacity: [0, 0.42, 0.22, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.8, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
