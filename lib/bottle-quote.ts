import { ensureSchema, getTursoClient, isTursoConfigured } from "@/lib/db";
import { GENRE_LABELS, WORRY_GENRES, type WorryGenre } from "@/lib/genres";

export type PublicBottleQuote = {
  text: string;
  genre: WorryGenre;
  genreLabel: string;
};

export async function fetchBottleQuoteById(id: string): Promise<PublicBottleQuote | null> {
  if (!id || id.length > 64) return null;
  if (!isTursoConfigured()) return null;
  try {
    await ensureSchema();
    const db = getTursoClient();
    const rs = await db.execute({
      sql: "SELECT content, genre FROM bottles WHERE id = ?",
      args: [id],
    });
    const row = rs.rows[0] as Record<string, unknown> | undefined;
    const content = row?.content;
    const genre = row?.genre;
    if (typeof content !== "string" || !content.trim()) return null;
    if (typeof genre !== "string" || !(WORRY_GENRES as readonly string[]).includes(genre)) return null;
    const g = genre as WorryGenre;
    return {
      text: content.trim(),
      genre: g,
      genreLabel: GENRE_LABELS[g] ?? genre,
    };
  } catch {
    return null;
  }
}
