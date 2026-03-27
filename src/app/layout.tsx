import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "JD 축구 대회 관리",
  description: "축구 토너먼트 및 리그 대회 관리 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
                <span className="text-2xl">⚽</span>
                <span>JD 대회 관리</span>
              </Link>
              <div className="flex items-center gap-6 text-sm font-medium">
                <Link href="/tournaments" className="text-gray-600 hover:text-blue-600 transition-colors">대회 목록</Link>
                <Link href="/admin" className="text-gray-600 hover:text-blue-600 transition-colors">관리자</Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
