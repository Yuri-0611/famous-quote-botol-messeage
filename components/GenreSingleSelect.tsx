"use client";

import { WORRY_GENRES, GENRE_LABELS, type WorryGenre } from "@/lib/genres";

export function GenreSingleSelect({
  value,
  onChange,
  disabled,
  name,
}: {
  value: WorryGenre | null;
  onChange: (g: WorryGenre) => void;
  disabled?: boolean;
  name: string;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      role="radiogroup"
      aria-label={name}
    >
      {WORRY_GENRES.map((g) => {
        const selected = value === g;
        return (
          <button
            key={g}
            type="button"
            disabled={disabled}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(g)}
            className={[
              "rounded-xl border px-2 py-2.5 text-left text-xs font-medium leading-snug transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/90 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 sm:px-3 sm:text-sm",
              selected
                ? "border-cyan-300/60 bg-cyan-400/15 text-white shadow-[0_0_0_1px_rgba(103,232,249,0.25)]"
                : "border-white/15 bg-black/20 text-slate-100 hover:border-white/30 hover:bg-white/10",
            ].join(" ")}
          >
            {GENRE_LABELS[g]}
          </button>
        );
      })}
    </div>
  );
}
