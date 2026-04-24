import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchQuoteById } from "@/lib/quote-by-id";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const q = await fetchQuoteById(id);
  if (!q) {
    return {
      title: "名言が見つかりません | 悩み別・名言ボトル",
      robots: { index: false, follow: false },
    };
  }
  const title = `『${q.text}』 - 悩み別・名言ボトル`;
  const description = `私の悩みへのアンサー：『${q.text}』 - ${q.author}`;
  return {
    title,
    description,
  };
}

export default async function QuoteByIdPage({ params }: Props) {
  const { id } = await params;
  const q = await fetchQuoteById(id);
  if (!q) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-4 pb-20 pt-12 sm:max-w-xl">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
        quote · share
      </p>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-black/30 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/85">
          message for you
        </p>
        <p className="mt-4 text-center text-sm leading-relaxed text-slate-100/95">
          この言葉は、かつてあなたと同じように悩んだ誰かを救った言葉です。
        </p>
        <h1 className="mt-8 text-balance border-l-2 border-cyan-400/50 pl-4 text-2xl font-semibold leading-relaxed text-white sm:text-3xl">
          「{q.text}」
        </h1>
        <p className="mt-4 text-right text-sm text-cyan-100/90">— {q.author}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300/85">{q.explanation}</p>
        <p className="mt-2 text-center text-xs text-slate-500">
          ジャンル：
          <span className="text-slate-300">{q.genreLabels.join(" / ")}</span>
        </p>
      </section>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
        <p className="text-sm leading-relaxed text-slate-200">
          受け取った言葉を胸に、あなたも次の人へ優しさをつなげられます。
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-900/30 hover:from-cyan-300 hover:to-sky-400"
        >
          もう一度、別の悩みを流す
        </Link>
        <Link
          href={`/share?q=${encodeURIComponent(q.text)}`}
          className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
        >
          この体験をシェアする
        </Link>
      </div>
    </main>
  );
}
