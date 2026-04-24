import { eq } from "drizzle-orm";
import { ensureSchema, isTursoConfigured } from "@/lib/db";
import { getDb } from "@/lib/drizzle";
import { GENRE_LABELS, type WorryGenre } from "@/lib/genres";
import { quotes } from "@/lib/schema";

export type PublicQuote = {
  id: string;
  text: string;
  author: string;
  explanation: string;
  genres: WorryGenre[];
  genreLabels: string[];
};

export async function fetchQuoteById(id: string): Promise<PublicQuote | null> {
  if (!isTursoConfigured()) return null;
  try {
    await ensureSchema();
    const db = getDb();
    const rows = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    const gs = row.category
      .split(",")
      .map((x) => x.trim())
      .filter((x): x is WorryGenre => x in GENRE_LABELS);
    if (gs.length === 0) return null;
    return {
      id: row.id,
      text: row.content,
      author: row.author,
      explanation: row.explanation,
      genres: gs,
      genreLabels: gs.map((g) => GENRE_LABELS[g]),
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}
