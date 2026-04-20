type AdSlotProps = {
  /** 広告スクリプト側で参照するスロット ID（例: AdSense data-ad-slot） */
  slotId: string;
  className?: string;
};

/**
 * 本番では視覚的なプレースホルダーを出さず、広告タグを差し込める DOM フックだけ残す。
 * ローカルで枠を確認したいときは `NEXT_PUBLIC_AD_PREVIEW=1`。
 */
export function AdSlot({ slotId, className = "" }: AdSlotProps) {
  const showPreview = process.env.NEXT_PUBLIC_AD_PREVIEW === "1";

  if (!showPreview) {
    return (
      <div
        className={`mx-auto w-full max-w-3xl ${className}`}
        data-ad-slot={slotId}
        data-ad-placeholder="true"
        aria-hidden
      />
    );
  }

  return (
    <aside
      className={`mx-auto w-full max-w-3xl px-3 py-2 ${className}`}
      aria-label={`広告枠（プレビュー） ${slotId}`}
      data-ad-slot={slotId}
    >
      <div className="rounded-2xl border border-dashed border-white/20 bg-black/25 px-4 py-6 text-center text-xs text-slate-400 backdrop-blur-sm">
        <p className="font-medium tracking-wide text-slate-300">広告プレビュー</p>
        <p className="mt-2 font-mono text-[11px] text-slate-500">{slotId}</p>
        <p className="mt-1 text-[10px] text-slate-600">NEXT_PUBLIC_AD_PREVIEW=1 のときのみ表示</p>
      </div>
    </aside>
  );
}
