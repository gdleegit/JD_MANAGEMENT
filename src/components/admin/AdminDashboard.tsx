"use client";

import { useRouter } from "next/navigation";
import TournamentsTab from "./TournamentsTab";

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
      <TournamentsTab initialTournaments={tournaments} />
    </div>
  );
}
