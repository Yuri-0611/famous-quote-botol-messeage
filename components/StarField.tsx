"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

type Star = { id: number; x: number; y: number; r: number; d: number; o: number };

function makeStars(n: number): Star[] {
  const out: Star[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: 0.6 + Math.random() * 1.4,
      d: 40 + Math.random() * 90,
      o: 0.12 + Math.random() * 0.45,
    });
  }
  return out;
}

export function StarField() {
  const reduce = useReducedMotion();
  const stars = useMemo(() => makeStars(52), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[2] overflow-hidden" aria-hidden="true">
      {stars.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.r,
            height: s.r,
            opacity: s.o,
            boxShadow: "0 0 6px rgba(200,230,255,0.35)",
          }}
          animate={
            reduce
              ? undefined
              : {
                  x: [0, 10, -6, 0],
                  y: [0, -14, 8, 0],
                  opacity: [s.o * 0.55, s.o, s.o * 0.65, s.o * 0.85],
                }
          }
          transition={{
            duration: s.d,
            repeat: Infinity,
            ease: "linear",
            delay: s.id * 0.08,
          }}
        />
      ))}
    </div>
  );
}
