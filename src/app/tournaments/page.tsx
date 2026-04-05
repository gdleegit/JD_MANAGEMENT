import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export default async function TournamentsPage() {
  const rawTournaments = await prisma.tournament.findMany({
    where: { active: true },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { teams: true, matches: true } },
      teams: { include: { team: { include: { _count: { select: { players: true } } } } } },
      sponsors: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
    },
  });

  const STATUS: Record<string, { label: string; badgeCls: string; borderColor: string }> = {
    UPCOMING: { label: "예정",   badgeCls: "bg-gray-100 text-gray-500",           borderColor: "#d1d5db" },
    ONGOING:  { label: "진행중", badgeCls: "bg-emerald-100 text-emerald-700",     borderColor: "#10b981" },
    FINISHED: { label: "종료",   badgeCls: "bg-blue-100 text-blue-700",           borderColor: "#3b82f6" },
  };
  const typeLabel: Record<string, string> = {
    KNOCKOUT: "토너먼트", LEAGUE: "리그", GROUP: "조별·기수 리그",
  };
  const sportLabel: Record<string, string> = {
    FOOTBALL: "축구", BASKETBALL: "농구", VOLLEYBALL: "배구",
    BASEBALL: "야구", FUTSAL: "풋살", BADMINTON: "배드민턴",
    TABLE_TENNIS: "탁구", TENNIS: "테니스", BILLIARDS: "당구", GOLF: "골프",
  };
  const sportEmoji: Record<string, string> = {
    FOOTBALL: "⚽", BASKETBALL: "🏀", VOLLEYBALL: "🏐",
    BASEBALL: "⚾", FUTSAL: "⚽", BADMINTON: "🏸",
    TABLE_TENNIS: "🏓", TENNIS: "🎾", BILLIARDS: "🎱", GOLF: "⛳",
  };

  const kstToday = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());

  function calcStatus(t: { status: string; startDate: Date | null; endDate: Date | null }) {
    const start = t.startDate ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(t.startDate) : null;
    const end   = t.endDate   ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(t.endDate)   : null;
    if (!start) return t.status; // 날짜 없으면 DB 상태 사용
    if (end && kstToday > end)   return "FINISHED";
    if (kstToday >= start)       return "ONGOING";
    return "UPCOMING";
  }

  // 진행중 먼저, 나머지는 startDate 최신순 (이미 DB 쿼리에서 정렬됨)
  const tournaments = [...rawTournaments].sort((a, b) => {
    const sa = calcStatus(a) === "ONGOING" ? 0 : 1;
    const sb = calcStatus(b) === "ONGOING" ? 0 : 1;
    return sa - sb;
  });

  const TYPE_ORDER = ["TITLE", "SPONSOR", "SUPPORT"];
  const TYPE_LABEL: Record<string, string> = { TITLE: "타이틀 협찬", SPONSOR: "협찬", SUPPORT: "후원" };

  return (
    <div>
      <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6">대회 목록</h1>

      {tournaments.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🏆</p>
          <p>등록된 대회가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t) => {
            const st = STATUS[calcStatus(t)] || STATUS.UPCOMING;
            const playerCount = t.teams.reduce((sum, tt) => sum + tt.team._count.players, 0);
            const dateStr = t.startDate
              ? new Date(t.startDate).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" })
                + (t.endDate ? ` ~ ${new Date(t.endDate).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" })}` : "")
              : null;
            const sortedSponsors = TYPE_ORDER.flatMap(type => t.sponsors.filter(s => s.type === type));
            return (
              <div key={t.id} className="flex flex-col gap-2">
              <Link
                href={`/tournaments/${t.id}`}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                style={{ border: "1.5px solid #e2e8f0", borderTop: `4px solid ${st.borderColor}` }}
              >
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  {/* 상단: 상태 + 대회 유형 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.badgeCls}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.borderColor }} />
                      {st.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                        {sportEmoji[t.sport]} {sportLabel[t.sport] ?? t.sport}
                      </span>
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                        {typeLabel[t.type] || t.type}
                      </span>
                    </div>
                  </div>

                  {/* 대회명 */}
                  <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 leading-tight mb-1.5 group-hover:text-blue-700 transition-colors">
                    {t.name}
                  </h3>

                  {/* 설명 */}
                  {t.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{t.description}</p>
                  )}

                  <div className="flex-1" />

                  {/* 날짜 */}
                  {dateStr && (
                    <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {dateStr}
                    </p>
                  )}

                  {/* 하단 통계 */}
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400">팀</span>
                      <span className="font-bold text-gray-700">{t._count.teams}</span>
                    </span>
                    <span className="text-gray-200">|</span>
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400">선수</span>
                      <span className="font-bold text-gray-700">{playerCount}</span>
                    </span>
                    <span className="text-gray-200">|</span>
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400">경기</span>
                      <span className="font-bold text-gray-700">{t._count.matches}</span>
                    </span>
                  </div>
                </div>
              </Link>

              {/* 협찬 배너 — 대회 카드 아래, 한 행씩 */}
              {sortedSponsors.length > 0 && (
                <div className="rounded-xl border border-gray-100 bg-gradient-to-r from-slate-50 to-blue-50 px-3 py-2 space-y-1.5">
                  {sortedSponsors.map(s => {
                    const gradeBadgeCls =
                      s.type === "TITLE"
                        ? "bg-blue-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wide flex-shrink-0"
                        : "bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0";

                    const row = (
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide w-9 flex-shrink-0">{TYPE_LABEL[s.type]}</span>
                        {s.logoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.logoUrl} alt={s.name} className="h-5 w-auto max-w-[60px] object-contain flex-shrink-0" />
                        )}
                        <span className={`font-bold flex-shrink-0 ${s.type === "TITLE" ? "text-sm text-gray-900" : "text-xs text-gray-800"}`}>{s.name}</span>
                        {(s.grade || s.description) && (
                          <span className="text-gray-300 flex-shrink-0 text-xs">|</span>
                        )}
                        {s.grade && <span className={gradeBadgeCls}>{s.grade}</span>}
                        {s.description && (
                          <span className="text-[9px] text-gray-500 truncate">{s.description}</span>
                        )}
                      </div>
                    );
                    return s.link ? (
                      <a key={s.id} href={s.link} target="_blank" rel="noopener noreferrer" className="block hover:opacity-75 transition-opacity">
                        {row}
                      </a>
                    ) : (
                      <div key={s.id}>{row}</div>
                    );
                  })}
                </div>
              )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
