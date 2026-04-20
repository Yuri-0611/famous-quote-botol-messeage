import { ImageResponse } from "@vercel/og";
import { loadNotoSerifJpWoff2 } from "@/lib/og-noto-serif";

/** OpenNext（Cloudflare）では edge ランタイム指定が非対応のため Node で生成 */
export const runtime = "nodejs";

const MAX_QUOTE = 480;

function sanitizeQuote(raw: string | null): string {
  if (!raw) return "名言ボトル";
  const s = raw.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, MAX_QUOTE);
  return s.length > 0 ? s : "名言ボトル";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const quote = sanitizeQuote(searchParams.get("quote"));

  let font400: ArrayBuffer;
  let font700: ArrayBuffer;
  try {
    [font400, font700] = await Promise.all([loadNotoSerifJpWoff2(400), loadNotoSerifJpWoff2(700)]);
  } catch {
    return new Response("Font load failed", { status: 500 });
  }

  const quoteFontSize = quote.length > 140 ? 34 : quote.length > 80 ? 40 : 48;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: "linear-gradient(165deg, #050a14 0%, #0a1a32 38%, #0c2744 62%, #071426 88%, #040d18 100%)",
        }}
      >
        {/* 星屑 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.45,
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 12% 18%, rgba(255,255,255,0.65), transparent), radial-gradient(1px 1px at 28% 12%, rgba(255,255,255,0.4), transparent), radial-gradient(1.5px 1.5px at 72% 22%, rgba(200,230,255,0.55), transparent), radial-gradient(1px 1px at 88% 14%, rgba(255,255,255,0.35), transparent)",
          }}
        />

        {/* 三日月 */}
        <div
          style={{
            position: "absolute",
            top: 56,
            right: 72,
            width: 118,
            height: 118,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(240,248,255,0.95) 0%, rgba(180,210,240,0.55) 55%, rgba(120,160,200,0.25) 100%)",
            boxShadow: "0 0 48px rgba(200,230,255,0.35)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 44,
            right: 48,
            width: 108,
            height: 108,
            borderRadius: "50%",
            background: "linear-gradient(165deg, #0a1a32 0%, #071426 100%)",
          }}
        />

        {/* 遠い水平線の光 */}
        <div
          style={{
            position: "absolute",
            bottom: 200,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent 0%, rgba(140,200,255,0.35) 50%, transparent 100%)",
          }}
        />

        {/* 海のシルエット（穏やかな波） */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 220,
            background:
              "linear-gradient(180deg, transparent 0%, rgba(8,40,70,0.55) 35%, rgba(4,24,48,0.92) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "-8%",
            width: "116%",
            height: 140,
            borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
            background: "linear-gradient(180deg, rgba(30,90,130,0.42) 0%, rgba(6,28,52,0.85) 100%)",
            transform: "translateY(24px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -10,
            left: "-4%",
            width: "108%",
            height: 110,
            borderRadius: "50% 50% 0 0 / 90% 90% 0 0",
            background: "linear-gradient(180deg, rgba(20,70,110,0.5) 0%, rgba(4,18,36,0.95) 100%)",
          }}
        />

        {/* 名言（中央） */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "72px 96px 120px",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              maxWidth: 1000,
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "rgba(248,252,255,0.96)",
                fontSize: quoteFontSize,
                fontFamily: '"Noto Serif JP"',
                fontWeight: 700,
                lineHeight: 1.55,
                letterSpacing: "0.04em",
                textShadow: "0 4px 28px rgba(0,20,50,0.75)",
              }}
            >
              「{quote}」
            </p>
          </div>
        </div>

        {/* フッター ブランディング */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            padding: "28px 40px 32px",
            zIndex: 4,
          }}
        >
          <p
            style={{
              margin: 0,
              maxWidth: 420,
              color: "rgba(200,220,240,0.82)",
              fontSize: 18,
              fontFamily: '"Noto Serif JP"',
              fontWeight: 400,
              lineHeight: 1.45,
              letterSpacing: "0.02em",
            }}
          >
            あなたの悩みに寄り添う、名言のボトル。
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 6,
            }}
          >
            <p
              style={{
                margin: 0,
                color: "rgba(230,245,255,0.95)",
                fontSize: 26,
                fontFamily: '"Noto Serif JP"',
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              心に響く 名言ボトル
            </p>
            <p
              style={{
                margin: 0,
                color: "rgba(160,195,220,0.88)",
                fontSize: 17,
                fontFamily: '"Noto Serif JP"',
                fontWeight: 400,
                letterSpacing: "0.12em",
              }}
            >
              お悩み名言ボトル
            </p>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Noto Serif JP", data: font400, style: "normal", weight: 400 },
        { name: "Noto Serif JP", data: font700, style: "normal", weight: 700 },
      ],
    },
  );
}
