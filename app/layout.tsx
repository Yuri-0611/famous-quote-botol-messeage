import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { AdSlot } from "@/components/AdSlot";
import { LegalFooter } from "@/components/LegalFooter";
import { SeaBackdrop } from "@/components/SeaBackdrop";
import { SeaPresenceRipples } from "@/components/SeaPresenceRipples";
import { StarField } from "@/components/StarField";
import "./globals.css";
import { getSiteUrl } from "@/lib/site-url";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl.startsWith("http") ? new URL(siteUrl) : undefined,
  title: "悩み別・名言ボトル｜夜の海へ",
  description:
    "いまの悩みを海に流し、同じジャンルの名言をひとつ受け取る体験。Turso に悩みと名言を蓄えます。",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "悩み別・名言ボトル",
    title: "悩み別・名言ボトル",
    description: "悩みを流し、名言を受け取る。何度でも。",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "悩み別・名言ボトル",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "悩み別・名言ボトル",
    description: "悩みを流し、名言を受け取る。何度でも。",
    images: ["/twitter-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <SeaBackdrop />
        <SeaPresenceRipples />
        <StarField />
        <div className="relative z-10 flex min-h-full flex-col">
          <AdSlot slotId="layout-top" className="pt-3" />
          <div className="flex flex-1 flex-col">{children}</div>
          <AdSlot slotId="layout-bottom" className="pb-4 pt-2" />
          <LegalFooter />
        </div>
      </body>
    </html>
  );
}
