/**
 * X インテントURL。末尾にシェア用ページ（OGP 用）の絶対URLを付与する。
 * @param canonicalPageUrl 例: `${origin}/quotes/{id}` または `${origin}/share?q=...`
 */
export function buildXIntentUrl(quote: string, _origin: string, canonicalPageUrl: string): string {
  const text = `今の自分にぴったりの言葉が届いた！\n\n「${quote}」\n\n#悩み別名言ボトル\n${canonicalPageUrl}`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
