"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TournamentsTab from "./TournamentsTab";
import TeamsTab from "./TeamsTab";

type Tournament = { id: string; name: string; type: string; status: string; _count: { teams: number; matches: number } };
type Team = { id: string; name: string; shortName?: string | null; color?: string | null; _count: { players: number } };

export default function AdminDashboard({
  tournaments,
  teams,
  username,
}: {
  tournaments: Tournament[];
  teams: Team[];
  username: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"tournaments" | "teams">("tournaments");

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">안녕하세요, {username}님</p>
        </div>
        <button onClick={logout} className="btn-secondary btn-sm">로그아웃</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("tournaments")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "tournaments" ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-800"}`}
        >
          대회 관리
        </button>
        <button
          onClick={() => setTab("teams")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "teams" ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-800"}`}
        >
          팀 관리
        </button>
      </div>

      {tab === "tournaments" && <TournamentsTab initialTournaments={tournaments} />}
      {tab === "teams" && <TeamsTab initialTeams={teams} />}
    </div>
  );
}
