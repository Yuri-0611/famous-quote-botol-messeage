import Link from "next/link";

export function LegalFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/20 px-4 py-6 text-center text-[11px] text-slate-500">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link href="/terms" className="text-cyan-200/85 underline-offset-4 hover:underline">
          利用規約
        </Link>
        <span className="text-slate-600" aria-hidden>
          ·
        </span>
        <Link href="/privacy" className="text-cyan-200/85 underline-offset-4 hover:underline">
          プライバシー
        </Link>
      </nav>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-600">
        悩みの投稿はデータベースに保存されます。個人情報は書かないでください。
      </p>
    </footer>
  );
}
