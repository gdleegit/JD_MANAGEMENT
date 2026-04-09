import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import { Bebas_Neue, Noto_Serif_KR } from "next/font/google";
import AdminFooterLink from "@/components/AdminFooterLink";
import { Analytics } from "@vercel/analytics/next";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });
const notoSerifKR = Noto_Serif_KR({ weight: ["400", "700"], subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "中東AA | Athletic Archive",
  description: "중동고 · 중동중 체육대회 공식 기록 보관소. 대회 일정, 경기 결과, 득점 순위, 참가팀 명단을 한눈에 확인하세요.",
  keywords: [
    "중동고", "중동중", "중동 체육대회", "중동 축구", "중동AA", "중동 Athletic Archive",
    "중동 체육위원회", "중동 경기 결과", "중동 대회 일정", "중동인", "중동고등학교 체육대회",
  ],
  openGraph: {
    title: "中東AA | Athletic Archive",
    description: "중동중고 체육대회 기록 보관소 🏆",
    type: "website",
    url: "https://joongdong-aa.vercel.app",
    siteName: "中東 Athletic Archive",
    locale: "ko_KR",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://joongdong-aa.vercel.app/tournaments",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <nav className="bg-gray-950 border-b border-white/15 sticky top-0 z-50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-15 sm:h-[68px]">
              <Link href="/tournaments" className="flex items-center gap-2.5 sm:gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-md group-hover:bg-blue-500/40 transition-all" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/jd2.svg" alt="中東 Athletic Archive" className="relative w-11 h-11 sm:w-[50px] sm:h-[50px]" />
                </div>
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="flex flex-col leading-none gap-[4px]">
                    <span className={`${notoSerifKR.className} text-[27px] sm:text-[34px] text-white font-bold group-hover:text-blue-50 transition-colors tracking-wide`}>中東</span>
                    <div className="flex justify-between font-medium text-[6px] sm:text-[7px] text-gray-300 tracking-widest">
                      {"JOONGDONG".split("").map((c, i) => <span key={i}>{c}</span>)}
                    </div>
                  </div>
                  <div className="flex items-end gap-2 sm:gap-2.5">
                    <span className="text-gray-400 text-[20px] sm:text-[24px] font-thin leading-none">|</span>
                    <span className={`${bebas.className} text-[14px] sm:text-[16px] tracking-[0.18em] group-hover:opacity-90 transition-opacity leading-none`}>
                      <span style={{ color: "#4a9fd4" }}>A</span>
                      <span className="text-gray-100">thletic </span>
                      <span style={{ color: "#4a9fd4" }}>A</span>
                      <span className="text-gray-100">rchive</span>
                    </span>
                  </div>
                </div>
              </Link>
              <div className="flex items-center text-xs sm:text-sm font-medium">
                </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {children}
        </main>
        <Analytics />
        <footer className="mt-12 border-t border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-400">
            <AdminFooterLink />
            <p className="text-[10px] text-gray-300 mb-3">Developed &amp; Designed by 105회 이건도</p>
            <p className="text-xs">© 2026 중동 체육위원회. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
