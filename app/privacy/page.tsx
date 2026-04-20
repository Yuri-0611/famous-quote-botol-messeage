import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシー | 悩み別・名言ボトル",
  description: "個人情報の取り扱いについての方針です。",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-16 pt-10 text-sm leading-relaxed text-slate-300 sm:max-w-xl">
      <Link href="/" className="text-xs text-cyan-200/90 underline-offset-4 hover:underline">
        ← トップへ
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-white">プライバシーについて</h1>
      <p className="mt-2 text-xs text-slate-500">最終更新日: 2026年4月19日</p>

      <section className="mt-8 space-y-4">
        <h2 className="text-base font-semibold text-white">1. 基本方針</h2>
        <p>
          本サービスでは、利用に必要な範囲で情報を取り扱います。
          <Link href="/terms" className="text-cyan-200/90 underline-offset-4 hover:underline">
            利用規約
          </Link>
          においても述べているとおり、投稿本文に個人情報を含めないようご協力をお願いします。
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-base font-semibold text-white">2. 取得する情報の例</h2>
        <ul className="list-inside list-disc space-y-2 text-slate-400">
          <li>ブラウザに保存されるセッション用 Cookie（本サービスの利用識別）</li>
          <li>任意で登録するメールアドレス（登録機能を利用する場合）</li>
          <li>投稿された名言テキストおよび選択ジャンル（データベースに保存）</li>
          <li>アクセスログ等（ホスティング事業者の仕様に準じます）</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-base font-semibold text-white">3. 利用目的</h2>
        <p>本サービスの提供・品質向上・不正利用防止・法令対応のために利用します。</p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-base font-semibold text-white">4. 第三者提供・委託</h2>
        <p>
          データベース（例: Turso）、ホスティング（例: Cloudflare）、AI
          機能（例: OpenAI）など、サービス提供に必要な範囲で各事業者のインフラを利用します。各事業者のプライバシーポリシーもあわせてご確認ください。
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-base font-semibold text-white">5. お問い合わせ</h2>
        <p className="text-xs text-slate-500">
          公開サイトに記載の連絡手段（準備中の場合は後日掲載）よりご連絡ください。
        </p>
      </section>
    </main>
  );
}
