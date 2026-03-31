import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import { Bebas_Neue, Noto_Serif_KR } from "next/font/google";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });
const notoSerifKR = Noto_Serif_KR({ weight: "400", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "中東 | Athletic Archive",
  description: "중동 체육위원회 Athletic Archive — 중동인의 땀방울을 기록하다.",
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
        <nav className="bg-gray-950 border-b border-white/10 sticky top-0 z-50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/tournaments" className="flex items-end gap-2.5 sm:gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-sm group-hover:bg-blue-500/30 transition-all" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/jd2.svg" alt="中東 Athletic Archive" className="relative w-10 h-10 sm:w-[46px] sm:h-[46px]" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className={`${notoSerifKR.className} text-[11px] sm:text-[13px] tracking-[0.35em] text-gray-300`}>中東</span>
                  <span className={`${bebas.className} text-[22px] sm:text-[26px] tracking-widest group-hover:opacity-90 transition-opacity`}>
                    <span style={{ color: "#176fc1" }}>A</span>
                    <span className="text-white">thletic </span>
                    <span style={{ color: "#176fc1" }}>A</span>
                    <span className="text-white">rchive</span>
                  </span>
                  <div className="h-px bg-white mt-0.5 w-[calc(100%+12px)]" />
                </div>
              </Link>
              <div className="flex items-center text-xs sm:text-sm font-medium">
                <Link href="/admin" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  관리자
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {children}
        </main>
        <footer className="mt-12 border-t border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-400">
            <p className="text-sm font-medium text-gray-500 mb-1">중동인의 땀방울을 기록하다.</p>
            <p className="text-[10px] text-gray-300 mb-3">Developed &amp; Designed by 105회 이건도</p>
            <p className="text-xs">© 2026 중동 체육위원회. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
