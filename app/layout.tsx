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
    "名言をボトルにして海へ。悩みのジャンルに合わせて拾う。Turso で世界中のひとつの海を共有します。",
  openGraph: {
    title: "悩み別・名言ボトル",
    description: "夜の海に流す一言。波から届く一言。",
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
