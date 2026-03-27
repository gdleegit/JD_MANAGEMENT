import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { teams: true, matches: true } } },
  });

  const statusLabel: Record<string, { label: string; cls: string }> = {
    UPCOMING: { label: "예정", cls: "badge-gray" },
    ONGOING: { label: "진행중", cls: "badge-green" },
    FINISHED: { label: "종료", cls: "badge-blue" },
  };
  const typeLabel: Record<string, string> = {
    KNOCKOUT: "토너먼트", LEAGUE: "리그", GROUP: "조별리그",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">대회 목록</h1>
      {tournaments.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🏆</p>
          <p>등록된 대회가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t) => {
            const st = statusLabel[t.status] || statusLabel.UPCOMING;
            return (
              <Link key={t.id} href={`/tournaments/${t.id}`} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className={st.cls}>{st.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{typeLabel[t.type] || t.type}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{t.name}</h3>
                {t.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{t.description}</p>}
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>팀 {t._count.teams}개</span>
                  <span>경기 {t._count.matches}개</span>
                </div>
                {t.startDate && (
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(t.startDate).toLocaleDateString("ko-KR")}
                    {t.endDate && ` ~ ${new Date(t.endDate).toLocaleDateString("ko-KR")}`}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
