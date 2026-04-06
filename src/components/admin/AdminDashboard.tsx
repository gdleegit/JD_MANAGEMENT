"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TournamentsTab from "./TournamentsTab";

type Tournament = { id: string; name: string; sport: string; type: string; status: string; _count: { teams: number; matches: number } };

export default function AdminDashboard({ username }: { username: string }) {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then(setTournaments)
      .catch(() => setTournaments([]));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-md opacity-50" style={{ background: "#176fc1" }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jd2.svg" alt="logo" className="relative w-9 h-9" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#176fc1" }}>Admin Console</p>
            <h1 className="text-white text-base font-extrabold leading-tight">관리자 대시보드</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            {username}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)";
              (e.currentTarget as HTMLElement).style.color = "#fca5a5";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.3)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            로그아웃
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      {tournaments === null ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl p-5 space-y-3 animate-pulse" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div className="h-5 bg-gray-200 rounded-lg w-2/5" />
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
          </div>
          <div className="lg:col-span-2 rounded-2xl p-5 space-y-3 animate-pulse" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div className="h-5 bg-gray-200 rounded-lg w-1/4" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded-lg w-1/2" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <TournamentsTab initialTournaments={tournaments} />
      )}
    </div>
  );
}
