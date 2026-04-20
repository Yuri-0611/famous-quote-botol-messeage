"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import {
  BottleGraphic,
  type BottleHue,
  type BottleVariant,
  bottleVariantFromIndex,
  randomBottleHue,
} from "@/components/BottleGraphic";

type Drift = {
  key: string;
  left: string;
  bottom: string;
  hue: BottleHue;
  variant: BottleVariant;
  delay: number;
  dur: number;
  rot: number;
  scale: number;
};

function randomDrifts(count: number): Drift[] {
  const out: Drift[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      key: `d-${i}`,
      left: `${6 + Math.random() * 88}%`,
      bottom: `${10 + Math.random() * 42}%`,
      hue: randomBottleHue(),
      variant: bottleVariantFromIndex(i),
      delay: Math.random() * 4,
      dur: 5 + Math.random() * 6,
      rot: -18 + Math.random() * 36,
      scale: 0.55 + Math.random() * 0.55,
    });
  }
  return out;
}

export function SeaBackdrop() {
  const reduce = useReducedMotion();
  const drifts = useMemo(() => randomDrifts(14), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="sea-moon absolute -right-8 top-10 h-28 w-28 rounded-full bg-gradient-to-br from-sky-100/90 to-cyan-200/40 blur-[2px] sm:right-10 sm:top-16 sm:h-36 sm:w-36"
        animate={
          reduce
            ? undefined
            : {
                y: [0, -10, 0],
                scale: [1, 1.04, 1],
                opacity: [0.85, 1, 0.88],
              }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-4 top-24 h-40 w-64 rotate-12 rounded-full bg-sky-200/10 blur-3xl sm:top-32"
        animate={reduce ? undefined : { opacity: [0.25, 0.45, 0.28], x: [0, -6, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      {drifts.map((d) => (
        <motion.div
          key={d.key}
          className="absolute opacity-[0.18] sm:opacity-[0.26]"
          style={{ left: d.left, bottom: d.bottom, transform: `rotate(${d.rot}deg) scale(${d.scale})` }}
          animate={
            reduce
              ? undefined
              : {
                  y: [0, -18, 4, 0],
                  x: [0, 6, -4, 0],
                  rotate: [d.rot, d.rot + 6, d.rot - 4, d.rot],
                  opacity: [0.12, 0.32, 0.18, 0.26],
                }
          }
          transition={{
            duration: d.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: d.delay,
          }}
        >
          <BottleGraphic hue={d.hue} variant={d.variant} className="h-14 w-10 sm:h-16 sm:w-11" />
        </motion.div>
      ))}

      <motion.svg
        className="absolute bottom-0 left-0 w-[200%] max-w-none text-cyan-400/25"
        style={{ height: "min(42vh, 320px)" }}
        viewBox="0 0 2400 200"
        preserveAspectRatio="none"
        animate={reduce ? undefined : { x: ["0%", "-4%", "0%"], y: [0, -3, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          fill="currentColor"
          d="M0 120 C 200 80, 400 160, 600 120 S 1000 80, 1200 120 S 1600 160, 1800 120 S 2200 80, 2400 120 L 2400 200 L 0 200 Z"
          className="wave-layer-1"
        />
        <path
          fill="currentColor"
          className="translate-y-3 text-sky-500/20 wave-layer-2"
          d="M0 140 C 240 100, 480 180, 720 140 S 1200 100, 1440 140 S 1920 180, 2160 140 S 2400 100, 2640 140 L 2640 200 L 0 200 Z"
          transform="translate(-120 0)"
        />
      </motion.svg>

      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-cyan-950/50 to-transparent" />
    </div>
  );
}
