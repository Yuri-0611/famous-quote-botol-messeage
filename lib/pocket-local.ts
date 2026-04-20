"use client";

import type { WorryGenre } from "@/lib/genres";

const STORAGE_KEY = "bq_pocket_v1";

export type PocketKind = "bottle" | "sea";

export type LocalPocketItem = {
  id: string;
  quoteText: string;
  genre: WorryGenre;
  kind: PocketKind;
  bottleId?: string | null;
  savedAt: number;
};

function readRaw(): unknown {
  if (typeof window === "undefined") return [];
  try {
    const s = window.localStorage.getItem(STORAGE_KEY);
    if (!s) return [];
    return JSON.parse(s) as unknown;
  } catch {
    return [];
  }
}

function writeRaw(items: LocalPocketItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota */
  }
}

export function loadLocalPocket(): LocalPocketItem[] {
  const raw = readRaw();
  if (!Array.isArray(raw)) return [];
  const out: LocalPocketItem[] = [];
  for (const x of raw) {
    if (typeof x !== "object" || x === null) continue;
    const o = x as Record<string, unknown>;
    const id = o.id;
    const quoteText = o.quoteText ?? o.quote_text;
    const genre = o.genre;
    const kind = o.kind;
    const savedAt = o.savedAt ?? o.saved_at;
    const bottleId = o.bottleId ?? o.bottle_id;
    if (
      typeof id !== "string" ||
      typeof quoteText !== "string" ||
      typeof genre !== "string" ||
      (kind !== "bottle" && kind !== "sea") ||
      typeof savedAt !== "number"
    ) {
      continue;
    }
    out.push({
      id,
      quoteText,
      genre: genre as WorryGenre,
      kind,
      bottleId: typeof bottleId === "string" ? bottleId : null,
      savedAt,
    });
  }
  return out.sort((a, b) => b.savedAt - a.savedAt);
}

export function saveLocalPocketItem(item: {
  quoteText: string;
  genre: WorryGenre;
  kind: PocketKind;
  bottleId?: string | null;
}): LocalPocketItem {
  const id = crypto.randomUUID();
  const savedAt = Date.now();
  const next: LocalPocketItem = {
    id,
    quoteText: item.quoteText.trim(),
    genre: item.genre,
    kind: item.kind,
    bottleId: item.bottleId ?? null,
    savedAt,
  };
  const cur = loadLocalPocket();
  const dedup = cur.filter(
    (x) => !(x.quoteText === next.quoteText && x.genre === next.genre && x.kind === next.kind),
  );
  dedup.unshift(next);
  writeRaw(dedup.slice(0, 200));
  return next;
}

export function removeLocalPocketItem(id: string) {
  const cur = loadLocalPocket().filter((x) => x.id !== id);
  writeRaw(cur);
}
