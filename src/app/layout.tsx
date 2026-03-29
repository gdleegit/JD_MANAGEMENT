import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "中東 AA | Athletic Archive",
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
        <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/tournaments" className="flex items-center gap-2 sm:gap-3 group">
                <Image src="/jd1.svg" alt="中東 Athletic Archive" width={34} height={34} className="sm:w-[42px] sm:h-[42px]" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] sm:text-xs font-semibold tracking-[0.3em] text-gray-300 uppercase">中東 AA</span>
                  <span className="text-base sm:text-lg font-extrabold tracking-wide bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-blue-500 transition-all">Athletic Archive</span>
                </div>
              </Link>
              <div className="flex items-center gap-1 sm:gap-4 text-xs sm:text-sm font-medium">
                <Link href="/admin" className="text-gray-300 hover:text-white transition-colors px-3 py-2">관리자</Link>
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
            <p className="text-xs mb-3">Developed &amp; Designed by 105회 이건도</p>
            <p className="text-xs">© 2026 중동 체육위원회. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
