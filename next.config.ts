import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
};

// Cloudflare / OpenNext 向けのローカル開発用フック。`next build`（Vercel 含む）では不要で、
// workerd 起動まわりで EPIPE 等のビルド失敗を招くことがあるためローカル開発時のみ実行する。
if (process.env.NODE_ENV === "development" && process.env.VERCEL !== "1") {
  initOpenNextCloudflareForDev();
}

export default nextConfig;
