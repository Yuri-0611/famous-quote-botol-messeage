/** Edge OG 用: Google Fonts から Noto Serif JP（woff2）を取得 */
let cached400: ArrayBuffer | null = null;
let cached700: ArrayBuffer | null = null;

function extractAllWoff2Urls(css: string): string[] {
  const out: string[] = [];
  for (const m of css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+\.woff2)\)/g)) {
    out.push(m[1]!);
  }
  return out;
}

export async function loadNotoSerifJpWoff2(weight: 400 | 700): Promise<ArrayBuffer> {
  if (weight === 400 && cached400) return cached400;
  if (weight === 700 && cached700) return cached700;

  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    },
  ).then((r) => r.text());

  const urls = extractAllWoff2Urls(css);
  const url400 = urls[0];
  if (!url400) {
    throw new Error("Noto Serif JP woff2 URL not found");
  }
  if (!cached400) {
    cached400 = await fetch(url400).then((r) => r.arrayBuffer());
  }
  const buf400 = cached400 as ArrayBuffer;
  if (weight === 400) return buf400;

  const url700 = urls[1];
  if (url700) {
    if (!cached700) {
      cached700 = await fetch(url700).then((r) => r.arrayBuffer());
    }
    return cached700 as ArrayBuffer;
  }
  cached700 = buf400;
  return buf400;
}
