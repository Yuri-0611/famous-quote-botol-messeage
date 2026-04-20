import { GENRE_LABELS, WORRY_GENRES, type WorryGenre } from "@/lib/genres";
import { pickFallbackQuote } from "@/lib/seaFallbackQuotes";

function normalizeGenres(raw: unknown): WorryGenre[] {
  if (!Array.isArray(raw)) return [];
  const out: WorryGenre[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    if (!(WORRY_GENRES as readonly string[]).includes(item)) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item as WorryGenre);
    if (out.length >= 2) break;
  }
  return out;
}

async function generateWithOpenAI(labels: string[]): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            "あなたは夜の海辺の語り手。ユーザーの悩みジャンルに寄り添う、短い日本語の名言・格言を1つだけ返す。引用符や説明は付けず、本文のみ。35〜80文字程度。",
        },
        {
          role: "user",
          content: `次の悩みのジャンルに合う言葉を1つ: ${labels.join("、")}`,
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const data: unknown = await res.json();
  const text =
    typeof data === "object" &&
    data !== null &&
    "choices" in data &&
    Array.isArray((data as { choices: unknown }).choices) &&
    (data as { choices: { message?: { content?: string } }[] }).choices[0]?.message?.content;
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function getSeaQuoteForGenres(
  genresInput: unknown,
): Promise<{ text: string; source: "openai" | "fallback"; genres: WorryGenre[] }> {
  const genres = normalizeGenres(genresInput);
  if (genres.length === 0) {
    throw new Error("有効なジャンルがありません。");
  }
  const labels = genres.map((g) => GENRE_LABELS[g]);
  let source: "openai" | "fallback" = "fallback";
  let text: string | null = null;
  try {
    text = await generateWithOpenAI(labels);
    if (text) source = "openai";
  } catch {
    text = null;
  }
  if (!text) {
    const f = pickFallbackQuote(genres);
    text = f.text;
    source = "fallback";
  }
  return { text, source, genres };
}
