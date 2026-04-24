import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { AdSlot } from "@/components/AdSlot";
import { LegalFooter } from "@/components/LegalFooter";
import { SeaBackdrop } from "@/components/SeaBackdrop";
import { SeaPresenceRipples } from "@/components/SeaPresenceRipples";
import { StarField } from "@/components/StarField";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://famous-quote-bottle-message.vercel.app",
  ),
  title: "悩み別・名言ボトル",
  description: "あなたの悩みに、偉人の言葉が流れ着く。",
  openGraph: {
    title: "悩み別・名言ボトル",
    description: "あなたの悩みに、偉人の言葉が流れ着く。",
    url: "/",
    siteName: "悩み別・名言ボトル",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "悩み別・名言ボトルのOGP画像",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "悩み別・名言ボトル",
    description: "あなたの悩みに、偉人の言葉が流れ着く。",
    images: ["/twitter-image.png"],
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
