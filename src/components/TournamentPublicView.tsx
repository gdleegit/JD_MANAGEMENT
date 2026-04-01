"use client";

import { useState, useEffect } from "react";
import BracketView from "./BracketView";

type Player = { id: string; name: string; number?: number | null; position?: string | null };
type Team = { id: string; name: string; color?: string | null; players?: Player[] };
type Goal = { id: string; type: string; teamId: string; minute?: number | null; half?: number | null; player?: { id: string; name: string } | null; team: { id: string; name: string; color?: string | null } };
type Group = { id: string; name: string; label?: string | null; color?: string | null; teams: GroupTeam[] };
type GroupTeam = { id: string; team: Team; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number };
type Match = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  date?: string | null;
  venue?: string | null;
  court?: string | null;
  round?: string | null;
  stage?: string | null;
  status: string;
  goals: Goal[];
  group?: { id: string; name: string; label?: string | null; color?: string | null } | null;
  matchOrder?: number | null;
  referee?: string | null;
  assistantReferee1?: string | null;
  assistantReferee2?: string | null;
  videoUrl?: string | null;
};
type TournamentTeam = { team: Team };
const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: "축구", BASKETBALL: "농구", VOLLEYBALL: "배구",
  BASEBALL: "야구", FUTSAL: "풋살", BADMINTON: "배드민턴",
  TABLE_TENNIS: "탁구", TENNIS: "테니스",
  BILLIARDS: "당구", GOLF: "골프",
};
const SPORT_EMOJI: Record<string, string> = {
  FOOTBALL: "⚽", BASKETBALL: "🏀", VOLLEYBALL: "🏐",
  BASEBALL: "⚾", FUTSAL: "⚽", BADMINTON: "🏸",
  TABLE_TENNIS: "🏓", TENNIS: "🎾",
  BILLIARDS: "🎱", GOLF: "⛳",
};

type Tournament = {
  id: string;
  name: string;
  sport: string;
  type: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  rules?: string | null;
  teams: TournamentTeam[];
  matches: Match[];
  groups: Group[];
};

type LeagueRow = {
  teamId: string;
  team?: { name: string; color?: string | null };
  played: number; won: number; drawn: number; lost: number;
  gf: number; ga: number; gd: number; points: number;
};

const STATUS_LABEL: Record<string, { label: string; cls: string; badgeCls: string; borderColor: string }> = {
  UPCOMING: { label: "예정",   cls: "badge-gray",  badgeCls: "bg-gray-100 text-gray-500",       borderColor: "#d1d5db" },
  ONGOING:  { label: "진행중", cls: "badge-green", badgeCls: "bg-emerald-100 text-emerald-700", borderColor: "#10b981" },
  FINISHED: { label: "종료",   cls: "badge-blue",  badgeCls: "bg-blue-100 text-blue-700",       borderColor: "#3b82f6" },
};
const TYPE_LABEL: Record<string, string> = { KNOCKOUT: "토너먼트", LEAGUE: "리그", GROUP: "조별·기수 리그" };

export default function TournamentPublicView({
  tournament,
  leagueStandings,
}: {
  tournament: Tournament;
  leagueStandings: LeagueRow[];
}) {
  const calcStatus = () => {
    const { startDate, endDate, status } = tournament;
    if (!startDate) return status;
    const fmt = (d: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date(d));
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
    if (endDate && today > fmt(endDate)) return "FINISHED";
    if (today >= fmt(startDate)) return "ONGOING";
    return "UPCOMING";
  };
  const st = STATUS_LABEL[calcStatus()] || STATUS_LABEL.UPCOMING;

  // Default tab by type
  const defaultTab = tournament.type === "KNOCKOUT" ? "bracket"
    : tournament.type === "GROUP" ? "division"
    : "standings";

  const [tab, setTab] = useState<"bracket" | "standings" | "division" | "schedule" | "teams" | "scorers" | "rules">(defaultTab as "bracket");

  // 참가팀 선수 — 페이지 로드 직후 백그라운드에서 미리 fetch
  const [teamPlayers, setTeamPlayers] = useState<Record<string, Player[]> | null>(null);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${tournament.id}/teams`)
      .then((r) => r.json())
      .then((data: Array<{ team: { id: string; players: Player[] } }>) => {
        const map: Record<string, Player[]> = {};
        for (const entry of data) map[entry.team.id] = entry.team.players;
        setTeamPlayers(map);
      })
      .catch(() => setTeamPlayers({}))
      .finally(() => setLoadingPlayers(false));
  }, [tournament.id]);

  const handleTabChange = (key: string) => {
    setTab(key as typeof tab);
  };

  const tabs = [
    tournament.type === "KNOCKOUT" && { key: "bracket", label: "대진표" },
    tournament.type === "LEAGUE" && { key: "standings", label: "순위표" },
    tournament.type === "GROUP" && { key: "division", label: "리그별 순위" },
    { key: "schedule", label: "날짜별 일정" },
    { key: "scorers", label: "득점 순위" },
    { key: "teams", label: "참가팀" },
    tournament.rules && { key: "rules", label: "운영규칙" },
  ].filter(Boolean) as { key: string; label: string }[];

  const playerCount = teamPlayers ? Object.values(teamPlayers).reduce((sum, p) => sum + p.length, 0) : null;

  // Top scorers
  const allGoals = tournament.matches.flatMap((m) => m.goals.filter((g) => g.type !== "OWN_GOAL"));
  const scorerMap: Record<string, { name: string; teamName: string; count: number }> = {};
  for (const g of allGoals) {
    const key = g.player?.id || `unk-${g.teamId}`;
    if (!scorerMap[key]) scorerMap[key] = { name: g.player?.name || "미상", teamName: g.team.name, count: 0 };
    scorerMap[key].count++;
  }
  const topScorers = Object.values(scorerMap).sort((a, b) => b.count - a.count).slice(0, 20);

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
        style={{ border: "1.5px solid #e2e8f0", borderTop: `4px solid ${st.borderColor}` }}
      >
        <div className="p-4 sm:p-6">
          {/* 상태 + 유형 */}
          <div className="flex items-center justify-between mb-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.badgeCls}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.borderColor }} />
              {st.label}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                {SPORT_EMOJI[tournament.sport]} {SPORT_LABELS[tournament.sport] ?? tournament.sport}
              </span>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                {TYPE_LABEL[tournament.type] || tournament.type}
              </span>
            </div>
          </div>

          {/* 대회명 */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-1">
            {tournament.name}
          </h1>

          {/* 설명 */}
          {tournament.description && (
            <p className="text-sm text-gray-500 mt-1 mb-3">{tournament.description}</p>
          )}

          {/* 날짜 */}
          {tournament.startDate && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {new Date(tournament.startDate).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" })}
              {tournament.endDate && ` ~ ${new Date(tournament.endDate).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" })}`}
            </p>
          )}

          {/* 통계 */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="text-gray-400">팀</span>
              <span className="font-bold text-gray-700">{tournament.teams.length}</span>
            </span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1">
              <span className="text-gray-400">선수</span>
              <span className="font-bold text-gray-700">{playerCount !== null ? playerCount : "…"}</span>
            </span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1">
              <span className="text-gray-400">경기</span>
              <span className="font-bold text-gray-700">{tournament.matches.length}</span>
            </span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1">
              <span className="text-gray-400">완료</span>
              <span className="font-bold text-gray-700">{tournament.matches.filter((m) => m.status === "FINISHED").length}</span>
            </span>
          </div>
        </div>

        {/* Tabs — 카드 하단에 붙임 */}
        <div className="border-t border-gray-100 overflow-x-auto">
          <div className="flex">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`px-3 sm:px-5 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  tab === t.key
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bracket Tab */}
      {tab === "bracket" && (
        <div className="card p-4 sm:p-6">
          <BracketView matches={tournament.matches} />
        </div>
      )}

      {/* League Standings Tab */}
      {tab === "standings" && (
        <div className="card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4">순위표</h2>
          <StandingsTable rows={leagueStandings} />
        </div>
      )}

      {/* Division/기수 Tab */}
      {tab === "division" && (
        <DivisionView tournament={tournament} />
      )}

      {/* Schedule Tab */}
      {tab === "schedule" && (
        <ScheduleView matches={tournament.matches} />
      )}

      {/* Scorers Tab */}
      {tab === "scorers" && (
        tournament.type === "GROUP" ? (
          <div className="space-y-4">
            {tournament.groups.length === 0 ? (
              <div className="card p-8 text-center text-gray-400">득점 기록이 없습니다</div>
            ) : (
              tournament.groups.map((group) => {
                const groupMatchIds = new Set(tournament.matches.filter((m) => m.group?.id === group.id).map((m) => m.id));
                const groupGoals = tournament.matches
                  .filter((m) => groupMatchIds.has(m.id))
                  .flatMap((m) => m.goals.filter((g) => g.type !== "OWN_GOAL"));
                const map: Record<string, { name: string; teamName: string; count: number }> = {};
                for (const g of groupGoals) {
                  const key = g.player?.id || `unk-${g.teamId}`;
                  if (!map[key]) map[key] = { name: g.player?.name || "미상", teamName: g.team.name, count: 0 };
                  map[key].count++;
                }
                const scorers = Object.values(map).sort((a, b) => b.count - a.count).slice(0, 20);
                return (
                  <div key={group.id} className="card p-4 sm:p-5">
                    <h3 className="font-bold text-base sm:text-lg mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.color || "#6366f1" }} />
                      {group.label || group.name}
                      <span className="text-gray-400 font-normal text-sm">득점 순위</span>
                    </h3>
                    {scorers.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">득점 기록이 없습니다</p>
                    ) : (
                      <div className="space-y-1">
                        {scorers.map((s, i) => (
                          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                            <span className={`w-7 text-center font-bold text-sm ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-gray-400"}`}>{i + 1}</span>
                            <span className="font-semibold flex-1">{s.name}</span>
                            <span className="text-sm text-gray-500">{s.teamName}</span>
                            <span className="font-bold text-blue-600 w-12 text-right">{s.count}골</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="card p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">득점 순위</h2>
            {topScorers.length === 0 ? (
              <p className="text-gray-400 text-center py-8">득점 기록이 없습니다</p>
            ) : (
              <div className="space-y-1">
                {topScorers.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                    <span className={`w-7 text-center font-bold text-sm ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-gray-400"}`}>{i + 1}</span>
                    <span className="font-semibold flex-1">{s.name}</span>
                    <span className="text-sm text-gray-500">{s.teamName}</span>
                    <span className="font-bold text-blue-600 w-12 text-right">{s.count}골</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* Rules Tab */}
      {tab === "rules" && tournament.rules && (
        <div className="card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-5">운영규칙</h2>
          <RulesRenderer rules={tournament.rules} />
        </div>
      )}

      {/* Teams Tab */}
      {tab === "teams" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">참가 팀</h2>
            <span className="text-sm text-gray-400">{tournament.teams.length}개 팀</span>
          </div>
          {loadingPlayers ? (
            <div className="card p-10 text-center text-gray-400 text-sm">선수 정보 불러오는 중...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...tournament.teams]
                .sort((a, b) => a.team.name.localeCompare(b.team.name, "ko", { numeric: true }))
                .map(({ team }) => {
                  const color = team.color || "#3b82f6";
                  const players = teamPlayers?.[team.id] ?? [];
                  const sortedPlayers = [...players].sort((a, b) => {
                    if (a.number != null && b.number != null) return a.number - b.number;
                    if (a.number != null) return -1;
                    if (b.number != null) return 1;
                    return a.name.localeCompare(b.name, "ko", { numeric: true });
                  });
                  return (
                    <div key={team.id} className="card overflow-hidden">
                      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: color + "22", borderBottom: `3px solid ${color}` }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: color }}>
                          {team.name.slice(0, 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{team.name}</h3>
                        </div>
                        {teamPlayers && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-gray-700" style={{ backgroundColor: color + "28", border: `1px solid ${color}66` }}>
                            {players.length}명
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        {!teamPlayers ? (
                          <p className="text-xs text-gray-300 text-center py-3">로딩 중...</p>
                        ) : sortedPlayers.length > 0 ? (
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                            {sortedPlayers.map((p) => (
                              <div key={p.id} className="flex items-center gap-1.5 py-1 px-1 rounded hover:bg-gray-50 transition-colors min-w-0">
                                <span
                                  className="w-5 h-5 rounded text-center leading-5 text-xs font-bold flex-shrink-0 text-white"
                                  style={{ backgroundColor: color }}
                                >
                                  {p.number ?? "·"}
                                </span>
                                <span className="text-sm font-medium text-gray-800 truncate">{p.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 text-center py-3">선수 정보 없음</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 날짜별 일정 뷰 ──────────────────────────────────────
function ScheduleView({ matches }: { matches: Match[] }) {
  // 날짜별 그룹핑
  const toKSTDate = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date(iso));
  const byDate = new Map<string, Match[]>();
  const sorted = [...matches].sort((a, b) => {
    const da = a.date ? toKSTDate(a.date) : "9999-99-99";
    const db = b.date ? toKSTDate(b.date) : "9999-99-99";
    if (da !== db) return da.localeCompare(db);
    return (a.matchOrder ?? 999) - (b.matchOrder ?? 999);
  });
  for (const m of sorted) {
    const key = m.date ? toKSTDate(m.date) : "__none__";
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(m);
  }

  const dateKeys = [...byDate.keys()];
  const todayKST = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date()); // "YYYY-MM-DD"
  const defaultDate = dateKeys.includes(todayKST) ? todayKST : null;
  const [selectedDate, setSelectedDate] = useState<string | null>(defaultDate);

  if (matches.length === 0) {
    return (
      <div className="card p-8 sm:p-12 text-center text-gray-400">
        <p>등록된 경기가 없습니다</p>
      </div>
    );
  }

  const formatDatePill = (key: string) => {
    if (key === "__none__") return "미정";
    const d = new Date(key + "T00:00:00");
    return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" });
  };

  const visibleEntries = selectedDate
    ? ([[selectedDate, byDate.get(selectedDate)!]] as [string, Match[]][]).filter(([, v]) => v)
    : [...byDate.entries()];

  return (
    <div className="space-y-4">
      {/* 날짜 선택 pill */}
      {dateKeys.length > 1 && (
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 pb-0.5">
          <div className="flex gap-1.5 w-max sm:w-auto sm:flex-wrap">
            <button
              onClick={() => setSelectedDate(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0 ${
                selectedDate === null
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              전체 <span className="opacity-60">{matches.length}</span>
            </button>
            {dateKeys.map((key) => {
              const isToday = key === todayKST;
              const isSelected = selectedDate === key;
              const count = byDate.get(key)!.length;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(isSelected ? null : key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0 ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : isToday
                      ? "bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {isToday && !isSelected && <span className="mr-1">•</span>}
                  {formatDatePill(key)} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 경기 목록 */}
      <div className="space-y-6">
        {visibleEntries.map(([dateKey, dayMatches]) => {
          const hasGroups = dayMatches.some((m) => m.group);
          const byGroup = new Map<string, { label: string; color: string; matches: Match[] }>();
          for (const m of dayMatches) {
            const gKey = m.group?.id ?? "__none__";
            if (!byGroup.has(gKey)) byGroup.set(gKey, { label: m.group?.label || m.group?.name || "미배정", color: m.group?.color || "#9ca3af", matches: [] });
            byGroup.get(gKey)!.matches.push(m);
          }

          return (
            <div key={dateKey}>
              {/* 날짜 헤더 — 전체 보기 시에만 표시 */}
              {selectedDate === null && (
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <h3 className="font-bold text-sm sm:text-base">
                    {dateKey === "__none__" ? "일정 미정" : new Date(dateKey + "T00:00:00").toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
                  </h3>
                  <span className="text-xs text-gray-400">{dayMatches.length}경기</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}

              {hasGroups ? (
                <div className="space-y-4">
                  {[...byGroup.entries()].map(([gKey, grp]) => (
                    <div key={gKey}>
                      <div className="flex items-center gap-2 mb-2 pl-2 border-l-[3px]" style={{ borderLeftColor: grp.color }}>
                        <span className="text-xs font-bold text-gray-700">{grp.label}</span>
                        <span className="text-xs text-gray-400">{grp.matches.length}경기</span>
                      </div>
                      <div className="space-y-2">
                        {grp.matches.map((m) => <MatchCard key={m.id} match={m} showDate={false} showOrder hideGroupBadge />)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {dayMatches.map((m) => <MatchCard key={m.id} match={m} showDate={false} showOrder />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getContrastColor(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#111827" : "#ffffff";
}

// ── 기수/조별 순위 뷰 ──────────────────────────────────
function DivisionView({ tournament }: { tournament: Tournament }) {
  const [activeGroup, setActiveGroup] = useState<string | null>(tournament.groups[0]?.id || null);

  if (tournament.groups.length === 0) {
    return (
      <div className="card p-12 text-center text-gray-400">
        <p>편성된 기수/조가 없습니다</p>
      </div>
    );
  }

  const visibleGroups = activeGroup
    ? tournament.groups.filter((g) => g.id === activeGroup)
    : tournament.groups;

  const toKSTDate = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date(iso));

  return (
    <div className="space-y-4">
      {/* 날짜 pill 스타일 리그 선택 */}
      <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 pb-0.5">
        <div className="flex gap-1.5 w-max">
          {/* 전체 버튼 */}
          <button
            onClick={() => setActiveGroup(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0 ${
              activeGroup === null
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
          >
            전체 <span className="opacity-60">{tournament.groups.length}</span>
          </button>

          {/* 리그별 버튼 */}
          {tournament.groups.map((g) => {
            const bgColor = g.color || "#6366f1";
            const isActive = activeGroup === g.id;
            const textColor = isActive ? getContrastColor(bgColor) : undefined;
            return (
              <button
                key={g.id}
                onClick={() => setActiveGroup(isActive ? null : g.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive ? "border-transparent" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
                style={isActive ? { backgroundColor: bgColor, borderColor: bgColor, color: textColor } : {}}
              >
                {g.label || g.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 순위표 + 경기 일정 */}
      {visibleGroups.map((group) => {
        const groupMatches = tournament.matches.filter((m) => m.group?.id === group.id);
        const grouped = new Map<string, Match[]>();
        const sorted = [...groupMatches].sort((a, b) => {
          const da = a.date ? toKSTDate(a.date) : "9999-99-99";
          const db = b.date ? toKSTDate(b.date) : "9999-99-99";
          if (da !== db) return da.localeCompare(db);
          return (a.matchOrder ?? 999) - (b.matchOrder ?? 999);
        });
        for (const m of sorted) {
          const key = m.date ? toKSTDate(m.date) : "__none__";
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(m);
        }

        return (
          <div key={group.id} className="space-y-3">
            {/* 순위표 */}
            <div className="card p-4 sm:p-5">
              <h3 className="font-bold text-base sm:text-lg mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color || "#6366f1" }} />
                <span>{group.label || group.name}</span>
                <span className="text-gray-500 font-normal text-sm sm:text-base">순위표</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="text-left pb-2 font-medium w-6">#</th>
                      <th className="text-left pb-2 font-medium pl-1.5">팀</th>
                      <th className="text-center pb-2 font-medium px-1.5">경기</th>
                      <th className="text-center pb-2 font-medium px-2 border-l border-gray-200">승</th>
                      <th className="text-center pb-2 font-medium px-2">무</th>
                      <th className="text-center pb-2 font-medium px-2">패</th>
                      <th className="text-center pb-2 font-medium px-1 border-l border-gray-200">득점</th>
                      <th className="text-center pb-2 font-medium px-1">실점</th>
                      <th className="text-center pb-2 font-medium px-1">득실</th>
                      <th className="text-center pb-2 font-bold px-1.5 border-l border-gray-200">승점</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...group.teams]
                      .sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.team.name.localeCompare(b.team.name, "ko"))
                      .map((gt, i) => (
                        <tr key={gt.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 text-gray-400 font-medium">{i + 1}</td>
                          <td className="py-2 pl-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: gt.team.color || "#3b82f6" }} />
                              <span className="font-medium truncate max-w-[72px] sm:max-w-none">{gt.team.name}</span>
                            </div>
                          </td>
                          <td className="py-2 text-center px-1.5">{gt.played}</td>
                          <td className="py-2 text-center px-2 border-l border-gray-100">{gt.won}</td>
                          <td className="py-2 text-center px-2">{gt.drawn}</td>
                          <td className="py-2 text-center px-2">{gt.lost}</td>
                          <td className="py-2 text-center px-1 border-l border-gray-100">{gt.gf}</td>
                          <td className="py-2 text-center px-1">{gt.ga}</td>
                          <td className="py-2 text-center px-1 text-gray-500">{(gt.gf - gt.ga) > 0 ? `+${gt.gf - gt.ga}` : gt.gf - gt.ga}</td>
                          <td className="py-2 text-center px-1.5 border-l border-gray-100 font-bold text-blue-600">{gt.points}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 경기 일정 — 개별 리그 선택 시에만 표시 */}
            {activeGroup !== null && groupMatches.length > 0 && (
              <div className="card p-4 sm:p-5">
                <h3 className="font-bold text-base sm:text-lg mb-4">{group.label || group.name} 경기 일정</h3>
                <div className="space-y-5">
                  {[...grouped.entries()].map(([dateKey, dayMatches]) => (
                    <div key={dateKey}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-semibold text-gray-500">
                          {dateKey === "__none__" ? "일정 미정" : new Date(dateKey + "T00:00:00").toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
                        </span>
                        <span className="text-xs text-gray-400">({dayMatches.length}경기)</span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                      <div className="space-y-2">
                        {dayMatches.map((m) => <MatchCard key={m.id} match={m} showDate={false} showOrder hideGroupBadge />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 공통 경기 카드 ──────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  SCHEDULED: { label: "예정",  cls: "bg-gray-100 text-gray-500",   dot: "bg-gray-400" },
  ONGOING:   { label: "진행중", cls: "bg-amber-100 text-amber-600", dot: "bg-amber-400" },
  FINISHED:  { label: "종료",  cls: "bg-green-100 text-green-600", dot: "bg-green-500" },
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return m ? m[1] : null;
}

function MatchCard({ match, showDate, showOrder, hideGroupBadge }: { match: Match; showDate: boolean; showOrder?: boolean; hideGroupBadge?: boolean }) {
  const finished = match.status === "FINISHED";
  const homeWin = finished && match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore;
  const awayWin = finished && match.homeScore != null && match.awayScore != null && match.awayScore > match.homeScore;
  const cfg = STATUS_CFG[match.status] ?? STATUS_CFG.SCHEDULED;
  const referees = [match.referee, match.assistantReferee1, match.assistantReferee2].filter(Boolean);
  const [showVideo, setShowVideo] = useState(false);

  const groupColor = match.group?.color || "#6366f1";
  const youtubeId = match.videoUrl ? getYouTubeId(match.videoUrl) : null;

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md"
      style={{
        border: "1.5px solid #e2e8f0",
        borderLeft: match.group ? `5px solid ${groupColor}` : "1.5px solid #e2e8f0",
        backgroundColor: "white",
      }}
    >
      <div className="p-3 sm:p-4">
      {/* meta row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap text-xs flex-1 min-w-0">
          {showOrder && (match.round || match.matchOrder != null) && (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex-shrink-0 border border-blue-100">
              {match.round || match.matchOrder}
            </span>
          )}
          {match.date && (
            <span className="font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full flex-shrink-0 text-xs" suppressHydrationWarning>
              {showDate
                ? new Date(match.date).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })
                : new Date(match.date).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}
            </span>
          )}
          {match.group && !hideGroupBadge && (
            <span className="px-2 py-0.5 rounded-full font-bold text-white text-xs flex-shrink-0" style={{ backgroundColor: groupColor }}>
              {match.group.label || match.group.name}
            </span>
          )}
          {match.court && <span className="text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full font-medium">{match.court}</span>}
          {match.venue && !match.court && <span className="text-gray-400 truncate">{match.venue}</span>}
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold flex-shrink-0 text-xs ${cfg.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Score row */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
        <div className={`flex-1 flex items-center justify-end gap-2 min-w-0 ${homeWin ? "text-blue-700" : "text-gray-800"}`}>
          <span className="font-bold text-right text-sm sm:text-base truncate leading-tight">{match.homeTeam.name}</span>
          <span className="w-4 h-4 rounded flex-shrink-0 shadow-sm" style={{ backgroundColor: match.homeTeam.color || "#3b82f6" }} />
        </div>
        <div className="flex items-center gap-1 min-w-[76px] sm:min-w-[88px] justify-center flex-shrink-0">
          {finished ? (
            <>
              <span className={`text-2xl sm:text-3xl font-black w-8 sm:w-10 text-right tabular-nums ${homeWin ? "text-blue-700" : "text-gray-900"}`}>{match.homeScore}</span>
              <span className="text-gray-300 font-black text-xl">:</span>
              <span className={`text-2xl sm:text-3xl font-black w-8 sm:w-10 text-left tabular-nums ${awayWin ? "text-blue-700" : "text-gray-900"}`}>{match.awayScore}</span>
            </>
          ) : (
            <span className="text-gray-300 font-bold text-sm tracking-widest">VS</span>
          )}
        </div>
        <div className={`flex-1 flex items-center gap-2 min-w-0 ${awayWin ? "text-blue-700" : "text-gray-800"}`}>
          <span className="w-4 h-4 rounded flex-shrink-0 shadow-sm" style={{ backgroundColor: match.awayTeam.color || "#ef4444" }} />
          <span className="font-bold text-sm sm:text-base truncate leading-tight">{match.awayTeam.name}</span>
        </div>
      </div>

      {/* Goals */}
      {match.goals.length > 0 && (() => {
        const hasHalf = match.goals.some(g => g.half);
        const goalTypeLabel = (type: string) => type === "OWN_GOAL" ? " OG" : type === "PENALTY" ? " PK" : "";

        const GoalRow = ({ g, align }: { g: typeof match.goals[0]; align: "left" | "right" }) =>
          align === "right" ? (
            <div className="text-right text-gray-500 leading-5">
              {g.player?.name || "미상"}{g.minute ? ` ${g.minute}'` : ""}{goalTypeLabel(g.type)} ⚽
            </div>
          ) : (
            <div className="text-left text-gray-500 leading-5">
              ⚽ {g.player?.name || "미상"}{g.minute ? ` ${g.minute}'` : ""}{goalTypeLabel(g.type)}
            </div>
          );

        if (!hasHalf) {
          const homeGoals = match.goals.filter(g => g.teamId === match.homeTeam.id);
          const awayGoals = match.goals.filter(g => g.teamId === match.awayTeam.id);
          return (
            <div className="mt-3 pt-2.5 border-t border-gray-100">
              <div className="grid grid-cols-[1fr_1px_1fr] text-xs">
                <div className="pr-2 space-y-0.5">{homeGoals.map((g, i) => <GoalRow key={i} g={g} align="right" />)}</div>
                <div className="bg-gray-100" />
                <div className="pl-2 space-y-0.5">{awayGoals.map((g, i) => <GoalRow key={i} g={g} align="left" />)}</div>
              </div>
            </div>
          );
        }

        return (
          <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-2 text-xs">
            {([1, 2] as const).map(half => {
              const halfGoals = match.goals.filter(g => g.half === half);
              if (halfGoals.length === 0) return null;
              const homeHalfGoals = halfGoals.filter(g => g.teamId === match.homeTeam.id);
              const awayHalfGoals = halfGoals.filter(g => g.teamId === match.awayTeam.id);
              return (
                <div key={half}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-bold text-gray-400">{half === 1 ? "전반" : "후반"}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="grid grid-cols-[1fr_1px_1fr]">
                    <div className="pr-2 space-y-0.5">{homeHalfGoals.map((g, i) => <GoalRow key={i} g={g} align="right" />)}</div>
                    <div className="bg-gray-100" />
                    <div className="pl-2 space-y-0.5">{awayHalfGoals.map((g, i) => <GoalRow key={i} g={g} align="left" />)}</div>
                  </div>
                </div>
              );
            })}
            {(() => {
              const noHalf = match.goals.filter(g => !g.half);
              if (!noHalf.length) return null;
              const homeNoHalf = noHalf.filter(g => g.teamId === match.homeTeam.id);
              const awayNoHalf = noHalf.filter(g => g.teamId === match.awayTeam.id);
              return (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-bold text-gray-300">기타</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="grid grid-cols-[1fr_1px_1fr]">
                    <div className="pr-2 space-y-0.5">{homeNoHalf.map((g, i) => <GoalRow key={i} g={g} align="right" />)}</div>
                    <div className="bg-gray-100" />
                    <div className="pl-2 space-y-0.5">{awayNoHalf.map((g, i) => <GoalRow key={i} g={g} align="left" />)}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* Referees */}
      {referees.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-400">
          {match.referee && <span>주심 {match.referee}</span>}
          {(match.assistantReferee1 || match.assistantReferee2) && (
            <span className="ml-3">부심 {[match.assistantReferee1, match.assistantReferee2].filter(Boolean).join(", ")}</span>
          )}
        </div>
      )}

      {/* Video */}
      {match.videoUrl && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          {youtubeId ? (
            <>
              <button
                onClick={() => setShowVideo(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                {showVideo ? "영상 닫기" : "경기 영상 보기"}
              </button>
              {showVideo && (
                <div className="mt-2 rounded-xl overflow-hidden aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </>
          ) : (
            <a
              href={match.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              경기 영상 보기
            </a>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

// ── 리그 순위표 ──────────────────────────────────────────
function StandingsTable({ rows }: { rows: LeagueRow[] }) {
  if (rows.length === 0) return <p className="text-gray-400 text-center py-6">순위 정보 없음</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-2 pr-2 font-medium w-6">#</th>
            <th className="pb-2 pr-2 font-medium">팀</th>
            <th className="pb-2 px-1.5 text-center font-medium">경기</th>
            <th className="pb-2 px-2 text-center font-medium border-l border-gray-200">승</th>
            <th className="pb-2 px-2 text-center font-medium">무</th>
            <th className="pb-2 px-2 text-center font-medium">패</th>
            <th className="pb-2 px-1 text-center font-medium border-l border-gray-200">득점</th>
            <th className="pb-2 px-1 text-center font-medium">실점</th>
            <th className="pb-2 px-1 text-center font-medium">득실</th>
            <th className="pb-2 px-1.5 text-center font-bold border-l border-gray-200">승점</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.teamId} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 pr-2 text-gray-400 font-medium">{i + 1}</td>
              <td className="py-2 pr-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.team?.color || "#3b82f6" }} />
                  <span className="font-medium truncate max-w-[80px] sm:max-w-none">{row.team?.name}</span>
                </div>
              </td>
              <td className="py-2 px-1.5 text-center">{row.played}</td>
              <td className="py-2 px-2 text-center border-l border-gray-100">{row.won}</td>
              <td className="py-2 px-2 text-center">{row.drawn}</td>
              <td className="py-2 px-2 text-center">{row.lost}</td>
              <td className="py-2 px-1 text-center border-l border-gray-100">{row.gf}</td>
              <td className="py-2 px-1 text-center">{row.ga}</td>
              <td className="py-2 px-1 text-center text-gray-500">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
              <td className="py-2 px-1.5 text-center border-l border-gray-100 font-bold text-blue-600">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 운영규칙 렌더러 ─────────────────────────────────────
function RulesRenderer({ rules }: { rules: string }) {
  const lines = rules.split("\n");

  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // 빈 줄 → 간격
        if (!trimmed) return <div key={i} className="h-2" />;

        // 숫자 섹션 헤더: "1.", "2." 등
        const sectionMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (sectionMatch) {
          return (
            <div key={i} className="flex items-baseline gap-2.5 mt-5 first:mt-0 pb-1.5 border-b border-gray-100">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center leading-none">
                {sectionMatch[1]}
              </span>
              <span className="font-bold text-gray-800 text-base">{sectionMatch[2]}</span>
            </div>
          );
        }

        // 불릿 항목: "-", "•", "*" (들여쓰기 유지)
        const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
        const bulletMatch = trimmed.match(/^[-•*]\s*(.*)/);
        if (bulletMatch) {
          const depth = Math.min(Math.floor(indent / 2), 2);
          return (
            <div
              key={i}
              className="flex items-start gap-2 py-0.5"
              style={{ paddingLeft: `${depth * 1 + 1}rem` }}
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
              <span className="text-gray-600 text-sm leading-relaxed">{bulletMatch[1]}</span>
            </div>
          );
        }

        // 일반 텍스트
        return (
          <p key={i} className="text-gray-600 text-sm leading-relaxed pl-4">
            {line}
          </p>
        );
      })}
    </div>
  );
}
