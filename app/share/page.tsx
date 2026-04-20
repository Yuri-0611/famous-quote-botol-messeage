import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";

type Props = { searchParams: Promise<{ q?: string }> };

const MAX = 800;

function decodeQuote(q: string | undefined): string {
  if (!q) return "";
  try {
    const s = decodeURIComponent(q).replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, MAX);
    return s;
  } catch {
    return "";
  }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = (await searchParams).q;
  const quote = decodeQuote(q);
  const site = getSiteUrl();
  if (!quote) {
    return {
      title: "名言をシェア | 名言ボトル",
      metadataBase: new URL(site),
    };
  }
  const ogImage = `${site}/api/og?quote=${encodeURIComponent(quote)}`;
  const titleShort = quote.length > 32 ? `${quote.slice(0, 32)}…` : quote;
  return {
    metadataBase: new URL(site),
    title: `「${titleShort}」| 心に響く 名言ボトル`,
    description: quote.slice(0, 160),
    openGraph: {
      title: "心に響く 名言ボトル",
      description: quote,
      type: "article",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: quote,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "心に響く 名言ボトル",
      description: quote,
      images: [ogImage],
    },
  };
}

export default async function ShareQuotePage({ searchParams }: Props) {
  const q = (await searchParams).q;
  const quote = decodeQuote(q);

  if (!quote) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-6 px-4 pb-20 pt-16 text-center">
        <h1 className="text-xl font-semibold text-white">シェアされた名言を表示できません</h1>
        <p className="text-sm text-slate-400">リンクのパラメータが欠けているか、長すぎます。</p>
        <Link href="/" className="text-cyan-200 underline-offset-4 hover:underline">
          トップへ
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 pb-20 pt-12 sm:max-w-xl">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
        海のことば · シェア用ページ
      </p>
      <h1 className="text-balance text-center text-2xl font-semibold leading-relaxed text-white sm:text-3xl">
        「{quote}」
      </h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/catch"
          className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15"
        >
          拾いにいく
        </Link>
        <Link href="/" className="inline-flex items-center justify-center text-sm text-cyan-200/90 underline-offset-4 hover:underline">
          トップへ
        </Link>
      </div>
    </main>
  );
}
