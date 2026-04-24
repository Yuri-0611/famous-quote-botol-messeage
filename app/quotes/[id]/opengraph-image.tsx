import { ImageResponse } from "next/og";
import { fetchQuoteById } from "@/lib/quote-by-id";

export const runtime = "nodejs";
export const alt = "悩み別・名言ボトルの名言カード";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

let fontDataPromise: Promise<ArrayBuffer> | null = null;

async function loadNotoSansJP(): Promise<ArrayBuffer> {
  if (!fontDataPromise) {
    fontDataPromise = (async () => {
      const cssRes = await fetch(
        "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700&display=swap",
      );
      if (!cssRes.ok) throw new Error("Google Fonts CSS の取得に失敗しました。");
      const css = await cssRes.text();
      const match = css.match(/url\((https:[^)]+)\)/);
      const fontUrl = match?.[1]?.replace(/['"]/g, "");
      if (!fontUrl) throw new Error("フォントURLを抽出できませんでした。");
      const fontRes = await fetch(fontUrl);
      if (!fontRes.ok) throw new Error("フォントファイルの取得に失敗しました。");
      return fontRes.arrayBuffer();
    })();
  }
  return fontDataPromise;
}

export default async function QuoteOpengraphImage({ params }: Props) {
  const { id } = await params;
  const q = await fetchQuoteById(id);
  const quote = q?.text ?? "この言葉は、きっと今のあなたに届く。";
  const author = q?.author ?? "悩み別・名言ボトル";
  const fontData = await loadNotoSansJP().catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "54px 70px",
          background:
            "radial-gradient(circle at 15% 10%, #203a7a 0%, rgba(32,58,122,0) 35%), linear-gradient(160deg, #020817 0%, #0b1f47 52%, #061226 100%)",
          color: "#f8fafc",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 34,
            letterSpacing: "0.08em",
            color: "#bae6fd",
            fontWeight: 700,
          }}
        >
          悩み別・名言ボトル
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: "28px 20px",
            textAlign: "center",
            fontSize: 54,
            lineHeight: 1.4,
            fontWeight: 700,
            whiteSpace: "pre-wrap",
          }}
        >
          「{quote}」
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "flex-end",
            fontSize: 36,
            color: "#dbeafe",
            fontWeight: 500,
          }}
        >
          — {author}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: "Noto Sans JP",
              data: fontData,
              weight: 700,
              style: "normal",
            },
          ]
        : [],
    },
  );
}
