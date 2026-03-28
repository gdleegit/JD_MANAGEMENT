"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TournamentsTab from "./TournamentsTab";

type Tournament = { id: string; name: string; type: string; status: string; _count: { teams: number; matches: number } };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">안녕하세요, {username}님</p>
        </div>
        <button onClick={logout} className="btn-secondary btn-sm">로그아웃</button>
      </div>
      {tournaments === null ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-5 animate-pulse space-y-3">
            <div className="h-5 bg-gray-200 rounded w-2/5" />
            {[...Array(4)].map((_, i) => <div key={i} className="h-9 bg-gray-100 rounded" />)}
          </div>
          <div className="lg:col-span-2 card p-5 animate-pulse space-y-3">
            <div className="h-5 bg-gray-200 rounded w-1/4" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
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
