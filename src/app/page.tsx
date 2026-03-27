import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { _count: { select: { teams: true, matches: true } } },
  });

  const statusLabel: Record<string, { label: string; cls: string }> = {
    UPCOMING: { label: "예정", cls: "badge-gray" },
    ONGOING: { label: "진행중", cls: "badge-green" },
    FINISHED: { label: "종료", cls: "badge-blue" },
  };

  const typeLabel: Record<string, string> = {
    KNOCKOUT: "토너먼트",
    LEAGUE: "리그",
    GROUP: "조별리그",
  };

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-10 text-white">
        <h1 className="text-4xl font-bold mb-3">축구 대회 관리 시스템</h1>
        <p className="text-blue-100 text-lg mb-6">토너먼트, 리그, 조별 대회를 한곳에서 관리하세요</p>
        <Link href="/tournaments" className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
          대회 목록 보기
        </Link>
      </div>

      {/* Latest Tournaments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">최근 대회</h2>
          <Link href="/tournaments" className="text-blue-600 text-sm font-medium hover:underline">전체 보기</Link>
        </div>

        {tournaments.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">🏆</p>
            <p className="font-medium">등록된 대회가 없습니다</p>
            <Link href="/admin" className="mt-4 inline-block text-blue-600 text-sm hover:underline">관리자 페이지에서 대회를 추가하세요</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((t) => {
              const st = statusLabel[t.status] || statusLabel.UPCOMING;
              return (
                <Link key={t.id} href={`/tournaments/${t.id}`} className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <span className={st.cls}>{st.label}</span>
                    <span className="text-xs text-gray-400">{typeLabel[t.type] || t.type}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t.name}</h3>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>팀 {t._count.teams}개</span>
                    <span>경기 {t._count.matches}개</span>
                  </div>
                  {t.startDate && (
                    <p className="text-xs text-gray-400 mt-2">{new Date(t.startDate).toLocaleDateString("ko-KR")}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
