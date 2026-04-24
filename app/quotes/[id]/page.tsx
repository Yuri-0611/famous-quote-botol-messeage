import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchQuoteById } from "@/lib/quote-by-id";
import { getSiteUrl } from "@/lib/site-url";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const q = await fetchQuoteById(id);
  const site = getSiteUrl();
  if (!q) {
    return {
      title: "名言が見つかりません | 悩み別・名言ボトル",
      robots: { index: false, follow: false },
    };
  }
  const ogImage = `${site}/api/og?quote=${encodeURIComponent(q.text)}`;
  const titleShort = q.text.length > 32 ? `${q.text.slice(0, 32)}…` : q.text;
  return {
    metadataBase: new URL(site),
    title: `「${titleShort}」| 悩み別・名言ボトル`,
    description: `${q.author} — ${q.text.slice(0, 140)}`,
    openGraph: {
      title: "悩み別・名言ボトル",
      description: q.text,
      type: "article",
      url: `${site}/quotes/${id}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: q.text,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "悩み別・名言ボトル",
      description: q.text,
      images: [ogImage],
    },
  };
}

export default async function QuoteByIdPage({ params }: Props) {
  const { id } = await params;
  const q = await fetchQuoteById(id);
  if (!q) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 pb-20 pt-12 sm:max-w-xl">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
        quote · share
      </p>
      <h1 className="text-balance text-center text-2xl font-semibold leading-relaxed text-white sm:text-3xl">
        「{q.text}」
      </h1>
      <p className="text-center text-sm text-slate-400">
        — {q.author}
        <br />
        ジャンル：<span className="text-slate-200">{q.genreLabel}</span>
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3 text-sm font-semibold text-slate-950"
        >
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
