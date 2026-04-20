/** 本番では https を強制（独自ドメインは NEXT_PUBLIC_SITE_URL を https:// で） */
function ensureHttpsIfRemote(url: string): string {
  const u = url.trim().replace(/\/$/, "");
  if (u.startsWith("http://") && !/localhost|127\.0\.0\.1/.test(u)) {
    return `https://${u.slice("http://".length)}`;
  }
  return u;
}

/** OG・canonical 用の絶対サイトURL */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return ensureHttpsIfRemote(explicit);
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}
