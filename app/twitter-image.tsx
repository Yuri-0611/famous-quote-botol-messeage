import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "悩み別・名言ボトル";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(165deg, #050a14 0%, #0a1a32 52%, #071426 100%)",
          color: "white",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: "0.4em", color: "#7dd3fc", textTransform: "uppercase" }}>
          worry · quote
        </div>
        <div style={{ marginTop: 28, fontSize: 68, fontWeight: 700, letterSpacing: "-0.02em" }}>悩み別・名言ボトル</div>
        <div style={{ marginTop: 22, fontSize: 30, color: "#cbd5e1", maxWidth: 900, textAlign: "center" as const }}>
          悩みを流し、同じジャンルの名言を受け取る
        </div>
      </div>
    ),
    { ...size },
  );
}
