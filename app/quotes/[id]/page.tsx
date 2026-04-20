import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchBottleQuoteById } from "@/lib/bottle-quote";
import { getSiteUrl } from "@/lib/site-url";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const bottle = await fetchBottleQuoteById(id);
  const site = getSiteUrl();
  if (!bottle) {
    return {
      title: "名言が見つかりません | 名言ボトル",
      robots: { index: false, follow: false },
    };
  }
  const ogImage = `${site}/api/og?quote=${encodeURIComponent(bottle.text)}`;
  const titleShort = bottle.text.length > 32 ? `${bottle.text.slice(0, 32)}…` : bottle.text;
  return {
    metadataBase: new URL(site),
    title: `「${titleShort}」| 心に響く 名言ボトル`,
    description: bottle.text.slice(0, 160),
    openGraph: {
      title: "心に響く 名言ボトル",
      description: bottle.text,
      type: "article",
      url: `${site}/quotes/${id}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: bottle.text,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "心に響く 名言ボトル",
      description: bottle.text,
      images: [ogImage],
    },
  };
}

export default async function QuoteByIdPage({ params }: Props) {
  const { id } = await params;
  const bottle = await fetchBottleQuoteById(id);
  if (!bottle) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 pb-20 pt-12 sm:max-w-xl">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
        漂流ボトル · シェア用ページ
      </p>
      <h1 className="text-balance text-center text-2xl font-semibold leading-relaxed text-white sm:text-3xl">
        「{bottle.text}」
      </h1>
      <p className="text-center text-sm text-slate-400">
        ジャンル：<span className="text-slate-200">{bottle.genreLabel}</span>
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/catch"
          className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15"
        >
          拾いにいく
        </Link>
        <Link
          href="/throw"
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3 text-sm font-semibold text-slate-950"
        >
          名言を流す
        </Link>
      </div>
    </main>
  );
}
