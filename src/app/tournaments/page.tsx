import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SponsorMarquee from "@/components/SponsorMarquee";

export const revalidate = 300;

export default async function TournamentsPage() {
  const rawTournaments = await prisma.tournament.findMany({
    where: { active: true },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { teams: true, matches: true } },
      teams: { select: { teamId: true } },
      sponsors: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
    },
  });

  const allTeamIds = [...new Set(rawTournaments.flatMap(t => t.teams.map(tt => tt.teamId)))];
  let playerCountByTeam: Record<string, number> = {};
  if (allTeamIds.length > 0) {
    const rows = await prisma.player.groupBy({
      by: ["teamId"],
      where: { teamId: { in: allTeamIds } },
      _count: { id: true },
    });
    playerCountByTeam = Object.fromEntries(rows.map(r => [r.teamId, r._count.id]));
  }

  const STATUS: Record<string, { label: string; badgeCls: string; borderColor: string }> = {
    UPCOMING: { label: "예정",   badgeCls: "bg-gray-100 text-gray-500",           borderColor: "#d1d5db" },
    ONGOING:  { label: "진행중", badgeCls: "bg-emerald-100 text-emerald-700",     borderColor: "#10b981" },
    FINISHED: { label: "종료",   badgeCls: "bg-red-100 text-red-600",             borderColor: "#ef4444" },
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
  const allSponsors = tournaments.flatMap(t =>
    TYPE_ORDER.flatMap(type => t.sponsors.filter(s => s.type === type))
  );

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
            const playerCount = t.teams.reduce((sum, tt) => sum + (playerCountByTeam[tt.teamId] ?? 0), 0);
            const dateStr = t.startDate
              ? new Date(t.startDate).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" })
                + (t.endDate ? ` ~ ${new Date(t.endDate).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" })}` : "")
              : null;
            const sortedSponsors = TYPE_ORDER.flatMap(type => t.sponsors.filter(s => s.type === type));
            const hasSponsor = sortedSponsors.length > 0;
            return (
              <div key={t.id} className="flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-200" style={{ borderRadius: "1rem", border: "1.5px solid #e2e8f0", borderTop: `4px solid ${st.borderColor}` }}>
              <Link
                href={`/tournaments/${t.id}`}
                className="group flex flex-col bg-white overflow-hidden transition-all duration-200 rounded-2xl"
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

              {/* 협찬 배너 — 대회 카드와 이어붙임 */}
              {/* 대회 카드 내 협찬·후원 배너 (임시 비활성화)
              {sortedSponsors.length > 0 && (
                <div className="rounded-b-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 px-3 py-2 space-y-1.5">
                  {sortedSponsors.map(s => {
                    const gradeBadgeCls = "inline-flex items-center bg-amber-400 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wide flex-shrink-0 leading-none";
                    const row = (
                      <div className="flex flex-col gap-0.5 py-0.5">
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-[8px] font-bold uppercase tracking-wide w-9 flex-shrink-0 text-amber-500">{TYPE_LABEL[s.type]}</span>
                          {s.logoUrl && (
                            <img src={s.logoUrl} alt={s.name} className="h-5 w-auto max-w-[60px] object-contain flex-shrink-0" />
                          )}
                          <span className="font-bold flex-shrink-0 text-sm text-amber-800">{s.name}</span>
                          {(s.grade || s.personName) && (
                            <span className="text-amber-200 flex-shrink-0 text-xs">|</span>
                          )}
                          {s.grade && <span className={gradeBadgeCls}>{s.grade}</span>}
                          {s.personName && <span className="text-[11px] font-semibold text-amber-700 flex-shrink-0">{s.personName}</span>}
                        </div>
                        {s.description && (
                          <span className="text-[10px] text-amber-600 pl-11 truncate">{s.description}</span>
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
              */}
              </div>
            );
          })}
        </div>

      )}

      {/* 방법 3+4: 하단 독립 협찬·후원 섹션 + 자동 스크롤 */}
      {allSponsors.length > 0 && (
        <section
          className="mt-16 pt-10 pb-10 bg-white border-t border-b border-gray-200"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
        >
          <div className="text-center mb-6 px-4">
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#176fc1" }}>Our Sponsors &amp; Supporters</p>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">중동과 함께해주신 협찬·후원</h2>
          </div>
          <div className="relative">
            {/* 좌우 페이드 처리 — 배경색 맞춤 */}
            <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <SponsorMarquee>
              {allSponsors.map((s, i) => {
                const card = (
                  <div className="flex flex-col items-center px-4 py-2.5 rounded-2xl border bg-gradient-to-b from-white to-gray-50 border-gray-200 shadow-lg shadow-black/40 hover:shadow-xl hover:shadow-black/50 hover:scale-[1.03] transition-all duration-200 overflow-hidden" style={{ width: "118px", borderTop: "3px solid #176fc1" }}>
                    {/* 기수·성명 슬롯 */}
                    <div className="flex items-center h-5 mb-1">
                      {(s.grade || s.personName) && (
                        <div className="flex items-center gap-0.5 whitespace-nowrap rounded-full px-2 py-0.5" style={{ backgroundColor: "#176fc1" }}>
                          {s.grade && <span className="text-[10px] font-black text-white">{s.grade}</span>}
                          {s.grade && s.personName && <span className="text-blue-200 text-[10px]">·</span>}
                          {s.personName && <span className="text-[10px] font-bold text-white">{s.personName}</span>}
                        </div>
                      )}
                    </div>
                    {/* 로고 */}
                    <div className="flex items-center justify-center h-10 w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.logoUrl ?? "/cd_logo2.png"}
                        alt={s.name}
                        className="max-h-9 w-auto object-contain"
                      />
                    </div>
                    {/* 협찬사명 */}
                    <span className="text-xs font-extrabold text-gray-900 whitespace-nowrap tracking-tight mt-1.5">{s.name}</span>
                    {/* 협찬 내용 뱃지 */}
                    <div className="mt-1.5 min-h-[20px] flex items-center">
                      {s.description ? (
                        <span
                          className="whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)", color: "#92400e", border: "1px solid #fbbf24" }}
                        >
                          {s.description}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
                return s.link ? (
                  <a key={i} href={s.link} target="_blank" rel="noopener noreferrer">{card}</a>
                ) : (
                  <div key={i}>{card}</div>
                );
              })}
            </SponsorMarquee>
          </div>
        </section>
      )}
    </div>
  );
}
