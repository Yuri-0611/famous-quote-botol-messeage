"use client";

import { useId, useMemo } from "react";

export type BottleHue = "blue" | "emerald" | "amber" | "glass" | "violet";

/** 0–4 の5種類のボトル形状 */
export type BottleVariant = 0 | 1 | 2 | 3 | 4;

const HUES: Record<
  BottleHue,
  { body: [string, string, string]; scroll: [string, string]; stroke: string }
> = {
  blue: {
    body: ["rgba(150,220,255,0.55)", "rgba(70,140,200,0.35)", "rgba(30,70,110,0.85)"],
    scroll: ["rgba(255,250,235,0.95)", "rgba(230,240,255,0.75)"],
    stroke: "rgba(255,255,255,0.35)",
  },
  emerald: {
    body: ["rgba(150,255,220,0.5)", "rgba(60,170,140,0.38)", "rgba(20,70,60,0.88)"],
    scroll: ["rgba(245,255,248,0.95)", "rgba(210,245,230,0.78)"],
    stroke: "rgba(200,255,230,0.32)",
  },
  amber: {
    body: ["rgba(255,210,150,0.55)", "rgba(200,130,70,0.4)", "rgba(90,50,20,0.88)"],
    scroll: ["rgba(255,248,235,0.95)", "rgba(255,230,200,0.78)"],
    stroke: "rgba(255,220,190,0.35)",
  },
  glass: {
    body: ["rgba(230,240,255,0.35)", "rgba(140,170,200,0.28)", "rgba(40,60,90,0.75)"],
    scroll: ["rgba(255,255,255,0.82)", "rgba(220,235,255,0.55)"],
    stroke: "rgba(255,255,255,0.45)",
  },
  violet: {
    body: ["rgba(210,190,255,0.55)", "rgba(120,90,200,0.4)", "rgba(40,25,80,0.88)"],
    scroll: ["rgba(250,245,255,0.95)", "rgba(230,220,255,0.78)"],
    stroke: "rgba(230,210,255,0.38)",
  },
};

const HUE_LIST: BottleHue[] = ["blue", "emerald", "amber", "glass", "violet"];

export function randomBottleHue(): BottleHue {
  return HUE_LIST[Math.floor(Math.random() * HUE_LIST.length)]!;
}

export function bottleVariantFromIndex(i: number): BottleVariant {
  const n = ((i % 5) + 5) % 5;
  return n as BottleVariant;
}

export function randomBottleVariant(): BottleVariant {
  return Math.floor(Math.random() * 5) as BottleVariant;
}

type CorkRect = { x: number; y: number; w: number; h: number; rx: number };
type ScrollSpec = { x: number; y: number; w: number; h: number; rx: number };

type VariantDef = {
  bodyPath: string;
  corkOuter: CorkRect;
  corkInner: CorkRect;
  scroll: ScrollSpec;
  /** 巻物のうすい罫線（viewBox 座標） */
  lines: ReadonlyArray<{ x1: number; y1: number; x2: number; y2: number }>;
  /** 胴体のハイライト楕円 */
  shine: { cx: number; cy: number; rx: number; ry: number };
  gradBody: { x1: number; y1: number; x2: number; y2: number };
  gradScroll: { x1: number; y1: number; x2: number; y2: number };
};

const VARIANT_DEFS: Record<BottleVariant, VariantDef> = {
  0: {
    bodyPath:
      "M40 10c9 0 16 6 18 15l2 10c1 6-2 12-8 14l-2 52c-1 10-8 16-20 16-12 0-19-6-20-16L8 49c-6-2-9-8-8-14l2-10C4 16 11 10 20 10h20z",
    corkOuter: { x: 28, y: 6, w: 24, h: 12, rx: 4 },
    corkInner: { x: 30, y: 4, w: 20, h: 6, rx: 2 },
    scroll: { x: 32, y: 34, w: 16, h: 48, rx: 2 },
    lines: [
      { x1: 34, y1: 40, x2: 46, y2: 40 },
      { x1: 34, y1: 48, x2: 44, y2: 48 },
      { x1: 34, y1: 56, x2: 46, y2: 56 },
      { x1: 34, y1: 64, x2: 42, y2: 64 },
    ],
    shine: { cx: 40, cy: 96, rx: 16, ry: 7 },
    gradBody: { x1: 22, y1: 10, x2: 58, y2: 108 },
    gradScroll: { x1: 34, y1: 36, x2: 46, y2: 86 },
  },
  1: {
    bodyPath:
      "M40 11C46.5 11 52 15 52 22L50 97C49 107 45.5 112 40 112S31 107 30 97L28 22C28 15 33.5 11 40 11Z",
    corkOuter: { x: 29, y: 5, w: 22, h: 12, rx: 3 },
    corkInner: { x: 31, y: 3, w: 18, h: 6, rx: 2 },
    scroll: { x: 35, y: 32, w: 10, h: 58, rx: 2 },
    lines: [
      { x1: 36, y1: 40, x2: 44, y2: 40 },
      { x1: 36, y1: 50, x2: 43, y2: 50 },
      { x1: 36, y1: 60, x2: 44, y2: 60 },
      { x1: 36, y1: 70, x2: 42, y2: 70 },
    ],
    shine: { cx: 40, cy: 100, rx: 11, ry: 6 },
    gradBody: { x1: 28, y1: 12, x2: 52, y2: 108 },
    gradScroll: { x1: 35, y1: 36, x2: 45, y2: 88 },
  },
  2: {
    bodyPath:
      "M40 4C48 4 54 10 54 18V22C64 30 70 48 70 66C70 90 58 104 40 110C22 104 10 90 10 66C10 48 16 30 26 22V18C26 10 32 4 40 4Z",
    corkOuter: { x: 30, y: 1, w: 20, h: 10, rx: 3 },
    corkInner: { x: 32, y: 0, w: 16, h: 5, rx: 2 },
    scroll: { x: 30, y: 46, w: 20, h: 40, rx: 2 },
    lines: [
      { x1: 32, y1: 52, x2: 48, y2: 52 },
      { x1: 32, y1: 60, x2: 46, y2: 60 },
      { x1: 32, y1: 68, x2: 48, y2: 68 },
      { x1: 32, y1: 76, x2: 44, y2: 76 },
    ],
    shine: { cx: 40, cy: 88, rx: 18, ry: 8 },
    gradBody: { x1: 22, y1: 8, x2: 58, y2: 102 },
    gradScroll: { x1: 30, y1: 48, x2: 50, y2: 84 },
  },
  3: {
    bodyPath:
      "M40 7C44 7 48 10 48 15V18H52C55 18 57 21 57 25V95C57 105 51 111 40 111C29 111 23 105 23 95V25C23 21 25 18 28 18H32V15C32 10 36 7 40 7Z",
    corkOuter: { x: 30, y: 4, w: 20, h: 11, rx: 3 },
    corkInner: { x: 32, y: 2, w: 16, h: 6, rx: 2 },
    scroll: { x: 31, y: 38, w: 18, h: 44, rx: 2 },
    lines: [
      { x1: 33, y1: 44, x2: 47, y2: 44 },
      { x1: 33, y1: 52, x2: 45, y2: 52 },
      { x1: 33, y1: 60, x2: 47, y2: 60 },
      { x1: 33, y1: 68, x2: 43, y2: 68 },
    ],
    shine: { cx: 40, cy: 96, rx: 15, ry: 7 },
    gradBody: { x1: 24, y1: 12, x2: 56, y2: 108 },
    gradScroll: { x1: 31, y1: 40, x2: 49, y2: 80 },
  },
  4: {
    bodyPath: "M40 6l14 14 2 42-8 52-8 6-8-6-8-52 2-42 14-14z",
    corkOuter: { x: 30, y: 2, w: 20, h: 10, rx: 2 },
    corkInner: { x: 32, y: 0, w: 16, h: 5, rx: 2 },
    scroll: { x: 32, y: 36, w: 16, h: 50, rx: 2 },
    lines: [
      { x1: 34, y1: 42, x2: 46, y2: 42 },
      { x1: 34, y1: 52, x2: 44, y2: 52 },
      { x1: 34, y1: 62, x2: 46, y2: 62 },
      { x1: 34, y1: 72, x2: 42, y2: 72 },
    ],
    shine: { cx: 40, cy: 92, rx: 14, ry: 8 },
    gradBody: { x1: 26, y1: 8, x2: 54, y2: 106 },
    gradScroll: { x1: 32, y1: 38, x2: 48, y2: 84 },
  },
};

export function BottleGraphic({
  className,
  hue,
  variant,
}: {
  className?: string;
  hue?: BottleHue;
  variant?: BottleVariant;
}) {
  const uid = useId().replace(/:/g, "");
  const resolvedHue = useMemo<BottleHue>(() => hue ?? randomBottleHue(), [hue]);
  const resolvedVariant = useMemo<BottleVariant>(() => variant ?? randomBottleVariant(), [variant]);
  const geom = VARIANT_DEFS[resolvedVariant];
  const bodyGrad = `${uid}-bqBottleBody`;
  const scrollGrad = `${uid}-bqScroll`;
  const pal = HUES[resolvedHue];

  return (
    <svg
      className={className}
      viewBox="0 0 80 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={bodyGrad}
          x1={geom.gradBody.x1}
          y1={geom.gradBody.y1}
          x2={geom.gradBody.x2}
          y2={geom.gradBody.y2}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={pal.body[0]} />
          <stop offset="0.45" stopColor={pal.body[1]} />
          <stop offset="1" stopColor={pal.body[2]} />
        </linearGradient>
        <linearGradient
          id={scrollGrad}
          x1={geom.gradScroll.x1}
          y1={geom.gradScroll.y1}
          x2={geom.gradScroll.x2}
          y2={geom.gradScroll.y2}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={pal.scroll[0]} />
          <stop offset="1" stopColor={pal.scroll[1]} />
        </linearGradient>
      </defs>
      <path
        d={geom.bodyPath}
        fill={`url(#${bodyGrad})`}
        stroke={pal.stroke}
        strokeWidth="1.2"
      />
      <rect
        x={geom.corkOuter.x}
        y={geom.corkOuter.y}
        width={geom.corkOuter.w}
        height={geom.corkOuter.h}
        rx={geom.corkOuter.rx}
        fill="rgba(120,90,60,0.85)"
        stroke="rgba(255,255,255,0.25)"
      />
      <rect
        x={geom.corkInner.x}
        y={geom.corkInner.y}
        width={geom.corkInner.w}
        height={geom.corkInner.h}
        rx={geom.corkInner.rx}
        fill="rgba(170,130,90,0.9)"
      />
      <rect
        x={geom.scroll.x}
        y={geom.scroll.y}
        width={geom.scroll.w}
        height={geom.scroll.h}
        rx={geom.scroll.rx}
        fill={`url(#${scrollGrad})`}
        stroke="rgba(40,60,90,0.25)"
      />
      {geom.lines.map((ln, i) => (
        <path
          key={i}
          d={`M${ln.x1} ${ln.y1} L${ln.x2} ${ln.y2}`}
          stroke="rgba(30,50,80,0.12)"
          strokeWidth="1"
        />
      ))}
      <ellipse
        cx={geom.shine.cx}
        cy={geom.shine.cy}
        rx={geom.shine.rx}
        ry={geom.shine.ry}
        fill="rgba(255,255,255,0.06)"
      />
    </svg>
  );
}
