import type { Metadata } from "next";
import { Space_Grotesk, Noto_Sans_JP } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import MainContent from "@/components/MainContent";
import ToastProvider from "@/components/ToastProvider";
import { getCurrentUser } from "@/lib/auth";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "ASOBI LAB | アソビラボ",
  description:
    "SNSを、もっと楽しく。もっと戦略的に。タレントのためのSNS活動支援ラボ、ASOBI LAB。",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="ja"
      className={`${spaceGrotesk.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-al-black">
        <Suspense fallback={<div className="hidden h-[73px] border-b border-al-gray-200 md:block" />}>
          <Header user={user ? { displayName: user.displayName } : null} />
        </Suspense>
        <MainContent>{children}</MainContent>
        <BottomNav />
        <ToastProvider />
      </body>
    </html>
  );
}
