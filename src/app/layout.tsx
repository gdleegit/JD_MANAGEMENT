import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "中東 Kick-Off",
  description: "中東 Kick-Off 축구 대회 관리 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
                <Image src="/jd1.svg" alt="中東 Kick-Off" width={34} height={34} className="sm:w-[42px] sm:h-[42px]" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] sm:text-xs font-semibold tracking-[0.3em] text-gray-300 uppercase">中 東</span>
                  <span className="text-base sm:text-lg font-extrabold tracking-wide bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-blue-500 transition-all">Kick-Off</span>
                </div>
              </Link>
              <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium">
                <Link href="/tournaments" className="text-gray-300 hover:text-white transition-colors">대회 목록</Link>
                <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">관리자</Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
