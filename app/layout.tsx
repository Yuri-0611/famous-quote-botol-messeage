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
  title: "悩み別・名言ボトル｜夜の海へ",
  description:
    "いまの悩みを海に流し、同じジャンルの名言をひとつ受け取る体験。Turso に悩みと名言を蓄えます。",
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
