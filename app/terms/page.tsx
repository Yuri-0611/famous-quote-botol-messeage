import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約 | 悩み別・名言ボトル",
  description: "悩み別・名言ボトルの利用にあたってのご案内です。",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-16 pt-10 text-sm leading-relaxed text-slate-300 sm:max-w-xl">
      <Link href="/" className="text-xs text-cyan-200/90 underline-offset-4 hover:underline">
        ← トップへ
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-white">利用規約</h1>
      <p className="mt-2 text-xs text-slate-500">最終更新日: 2026年4月19日</p>

      <section className="mt-8 space-y-4">
        <h2 className="text-base font-semibold text-white">1. はじめに</h2>
        <p>
          本サービス「悩み別・名言ボトル」（以下「本サービス」）をご利用いただくにあたり、本規約に同意していただく必要があります。
        </p>
      </section>

      <section id="posting-no-pii" className="mt-8 space-y-4 scroll-mt-8">
        <h2 className="text-base font-semibold text-white">2. 投稿内容について（重要）</h2>
        <p>
          本サービスに入力する悩みのテキスト（以下「投稿内容」）は、データベースに保存され、運営が内容を確認できる場合があります。名言は運営が用意したデータから表示されます。
        </p>
        <p className="rounded-xl border border-amber-200/25 bg-amber-500/10 px-3 py-3 text-amber-50/95">
          <strong className="text-amber-100">投稿内容に、個人情報を含めないでください。</strong>
          <br />
          例として、氏名・住所・電話番号・メールアドレス・勤務先・学校名・SNS
          アカウント・その他、ご自身や他人を特定できる情報を本文に書き込まないでください。第三者のプライバシーや名誉を害するおそれのある表現も禁止します。
        </p>
        <p>
          公序良俗に反する内容、違法行為を助長する内容、誹謗中傷、わいせつな表現、宣伝・スパムに該当する内容、その他運営が不適切と判断する内容の投稿を禁止します。運営の判断により、データの削除や利用制限を行うことがあります。
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-base font-semibold text-white">3. 免責事項</h2>
        <p>
          本サービスは現状有姿で提供されます。投稿内容の真実性・合法性・適切性について運営は保証しません。本サービスの利用により生じた損害について、運営に故意または重過失がある場合を除き、責任を負いません。
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-base font-semibold text-white">4. 規約の変更</h2>
        <p>運営は、必要に応じて本規約を変更できるものとします。変更後の利用については、変更後の規約が適用されます。</p>
      </section>

      <p className="mt-10 text-xs text-slate-500">
        お問い合わせ先は、公開サイトに記載の連絡手段（準備中の場合は後日掲載）に従ってください。
      </p>
    </main>
  );
}
