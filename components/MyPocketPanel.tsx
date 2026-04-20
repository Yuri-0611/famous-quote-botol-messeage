"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { GENRE_LABELS, type WorryGenre } from "@/lib/genres";
import { loadLocalPocket, removeLocalPocketItem, type LocalPocketItem } from "@/lib/pocket-local";

type ServerItem = {
  id: string;
  quoteText: string;
  genre: WorryGenre;
  kind: "bottle" | "sea";
  bottleId: string | null;
  savedAt: number;
};

type Row =
  | { key: string; source: "server"; item: ServerItem }
  | { key: string; source: "local"; item: LocalPocketItem };

export function MyPocketPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const local = loadLocalPocket().map(
      (item): Row => ({ key: `L-${item.id}`, source: "local", item }),
    );
    try {
      const r = await fetch("/api/pocket");
      const j: unknown = await r.json();
      const o = j as { items?: unknown; hasEmail?: unknown };
      const items = Array.isArray(o.items) ? o.items : [];
      const serverRows: Row[] = [];
      for (const x of items) {
        if (typeof x !== "object" || x === null) continue;
        const it = x as Record<string, unknown>;
        const id = it.id;
        const quoteText = it.quoteText;
        const genre = it.genre;
        const kind = it.kind;
        const savedAt = it.savedAt;
        const bottleId = it.bottleId;
        if (
          typeof id !== "string" ||
          typeof quoteText !== "string" ||
          typeof genre !== "string" ||
          (kind !== "bottle" && kind !== "sea") ||
          typeof savedAt !== "number"
        ) {
          continue;
        }
        serverRows.push({
          key: `S-${id}`,
          source: "server",
          item: {
            id,
            quoteText,
            genre: genre as WorryGenre,
            kind,
            bottleId: typeof bottleId === "string" ? bottleId : null,
            savedAt,
          },
        });
      }
      const merged = [...serverRows, ...local].sort((a, b) => {
        const ta = a.source === "server" ? a.item.savedAt : a.item.savedAt;
        const tb = b.source === "server" ? b.item.savedAt : b.item.savedAt;
        return tb - ta;
      });
      setRows(merged);
    } catch {
      setRows(local);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void reload();
  }, [open, reload]);

  async function removeRow(row: Row) {
    if (row.source === "local") {
      removeLocalPocketItem(row.item.id);
      setRows((xs) => xs.filter((x) => x.key !== row.key));
      return;
    }
    try {
      const r = await fetch(`/api/pocket?id=${encodeURIComponent(row.item.id)}`, { method: "DELETE" });
      if (r.ok) {
        setRows((xs) => xs.filter((x) => x.key !== row.key));
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="pocket-root"
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="ポケットを閉じる"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pocket-title"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="absolute left-1/2 top-[8vh] max-h-[min(78vh,560px)] w-[min(94vw,420px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/15 bg-slate-950/95 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 id="pocket-title" className="text-sm font-semibold text-white">
                マイ・ポケット
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-slate-200 hover:bg-white/10"
              >
                閉じる
              </button>
            </div>
            <div className="max-h-[min(62vh,480px)] overflow-y-auto px-3 py-3">
              {loading ? (
                <p className="py-8 text-center text-sm text-slate-400">読み込み中…</p>
              ) : rows.length === 0 ? (
                <p className="py-8 text-center text-sm leading-relaxed text-slate-400">
                  まだ保存した言葉がありません。
                  <br />
                  拾ったあとに「ポケットに保存」してみてください。
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {rows.map((row) => {
                    const it = row.item;
                    const label = GENRE_LABELS[it.genre] ?? it.genre;
                    const when = new Date(it.savedAt).toLocaleString("ja-JP", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <li
                        key={row.key}
                        className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-medium leading-relaxed text-white">「{it.quoteText}」</p>
                          <button
                            type="button"
                            onClick={() => void removeRow(row)}
                            className="shrink-0 rounded-lg border border-white/10 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-white/10"
                          >
                            削除
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-cyan-100/90">
                            {label}
                          </span>
                          <span>{it.kind === "bottle" ? "漂流ボトル" : "海のことば"}</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                            {row.source === "server" ? "クラウド" : "この端末"}
                          </span>
                          <span>{when}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
