"use client";

import { WORRY_GENRES, GENRE_LABELS, type WorryGenre } from "@/lib/genres";

export function GenreSingleSelect({
  values,
  onChange,
  disabled,
  name,
}: {
  values: WorryGenre[];
  onChange: (next: WorryGenre[]) => void;
  disabled?: boolean;
  name: string;
}) {
  function toggle(g: WorryGenre) {
    if (values.includes(g)) {
      onChange(values.filter((x) => x !== g));
      return;
    }
    if (values.length >= 2) return;
    onChange([...values, g]);
  }

  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      role="group"
      aria-label={name}
    >
      {WORRY_GENRES.map((g) => {
        const selected = values.includes(g);
        const order = selected ? values.indexOf(g) + 1 : null;
        const blocked = !selected && values.length >= 2;
        return (
          <button
            key={g}
            type="button"
            disabled={disabled || blocked}
            aria-pressed={selected}
            onClick={() => toggle(g)}
            className={[
              "rounded-xl border px-2 py-2.5 text-left text-xs font-medium leading-snug transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/90 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 sm:px-3 sm:text-sm",
              selected
                ? "border-cyan-300/60 bg-cyan-400/15 text-white shadow-[0_0_0_1px_rgba(103,232,249,0.25)]"
                : "border-white/15 bg-black/20 text-slate-100 hover:border-white/30 hover:bg-white/10",
            ].join(" ")}
          >
            <span>{GENRE_LABELS[g]}</span>
            {order ? (
              <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-300/20 text-[10px] text-cyan-100">
                {order}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
