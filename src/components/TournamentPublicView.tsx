"use client";

import { useState } from "react";
import BracketView from "./BracketView";

type Player = { id: string; name: string; number?: number | null; position?: string | null };
type Team = { id: string; name: string; color?: string | null; players: Player[] };
type Goal = { id: string; type: string; teamId: string; minute?: number | null; player?: { id: string; name: string } | null; team: Team };
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
};
type TournamentTeam = { team: Team };
type Tournament = {
  id: string;
  name: string;
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

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  UPCOMING: { label: "예정", cls: "badge-gray" },
  ONGOING: { label: "진행중", cls: "badge-green" },
  FINISHED: { label: "종료", cls: "badge-blue" },
};
const TYPE_LABEL: Record<string, string> = { KNOCKOUT: "토너먼트", LEAGUE: "리그", GROUP: "조별·기수 리그" };

export default function TournamentPublicView({
  tournament,
  leagueStandings,
}: {
  tournament: Tournament;
  leagueStandings: LeagueRow[];
}) {
  const st = STATUS_LABEL[tournament.status] || STATUS_LABEL.UPCOMING;

  // Default tab by type
  const defaultTab = tournament.type === "KNOCKOUT" ? "bracket"
    : tournament.type === "GROUP" ? "division"
    : "standings";

  const [tab, setTab] = useState<"bracket" | "standings" | "division" | "schedule" | "teams" | "scorers" | "rules">(defaultTab as "bracket");

  const tabs = [
    tournament.type === "KNOCKOUT" && { key: "bracket", label: "대진표" },
    tournament.type === "LEAGUE" && { key: "standings", label: "순위표" },
    tournament.type === "GROUP" && { key: "division", label: "기수별 순위" },
    { key: "schedule", label: "날짜별 일정" },
    { key: "scorers", label: "득점 순위" },
    { key: "teams", label: "참가팀" },
    tournament.rules && { key: "rules", label: "운영규칙" },
  ].filter(Boolean) as { key: string; label: string }[];

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={st.cls}>{st.label}</span>
          <span className="text-sm text-gray-400">{TYPE_LABEL[tournament.type] || tournament.type}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">{tournament.name}</h1>
        {tournament.description && <p className="text-gray-500 mt-1">{tournament.description}</p>}
        {tournament.startDate && (
          <p className="text-sm text-gray-400 mt-1">
            {new Date(tournament.startDate).toLocaleDateString("ko-KR")}
            {tournament.endDate && ` ~ ${new Date(tournament.endDate).toLocaleDateString("ko-KR")}`}
          </p>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 text-sm text-gray-500">
        <span>팀 {tournament.teams.length}개</span>
        <span>경기 {tournament.matches.length}개</span>
        <span>완료 {tournament.matches.filter((m) => m.status === "FINISHED").length}개</span>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit min-w-full sm:min-w-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bracket Tab */}
      {tab === "bracket" && (
        <div className="card p-6">
          <BracketView matches={tournament.matches} />
        </div>
      )}

      {/* League Standings Tab */}
      {tab === "standings" && (
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4">순위표</h2>
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
                  <div key={group.id} className="card p-5">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
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
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">득점 순위</h2>
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
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-5">운영규칙</h2>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {tournament.rules}
          </div>
        </div>
      )}

      {/* Teams Tab */}
      {tab === "teams" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">참가 팀</h2>
            <span className="text-sm text-gray-400">{tournament.teams.length}개 팀 · {tournament.teams.reduce((sum, t) => sum + t.team.players.length, 0)}명</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...tournament.teams]
              .sort((a, b) => a.team.name.localeCompare(b.team.name, "ko", { numeric: true }))
              .map(({ team }) => {
                const color = team.color || "#3b82f6";
                const sortedPlayers = [...team.players].sort((a, b) => {
                  if (a.number != null && b.number != null) return a.number - b.number;
                  if (a.number != null) return -1;
                  if (b.number != null) return 1;
                  return a.name.localeCompare(b.name, "ko", { numeric: true });
                });
                return (
                  <div key={team.id} className="card overflow-hidden">
                    {/* 컬러 헤더 바 */}
                    <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: color + "22", borderBottom: `3px solid ${color}` }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: color }}>
                        {team.name.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{team.name}</h3>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: color + "33", color }}>
                        {team.players.length}명
                      </span>
                    </div>
                    {/* 선수 목록 */}
                    <div className="p-3">
                      {sortedPlayers.length > 0 ? (
                        <div className="space-y-0.5">
                          {sortedPlayers.map((p) => (
                            <div key={p.id} className="flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-gray-50 transition-colors">
                              <span
                                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                                style={{ backgroundColor: p.number != null ? color : "#d1d5db" }}
                              >
                                {p.number ?? "·"}
                              </span>
                              <span className="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate">{p.name}</span>
                              {p.position && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 flex-shrink-0">{p.position}</span>
                              )}
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
        </div>
      )}
    </div>
  );
}

// ── 날짜별 일정 뷰 ──────────────────────────────────────
function ScheduleView({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <div className="card p-12 text-center text-gray-400">
        <p>등록된 경기가 없습니다</p>
      </div>
    );
  }

  // ISO 날짜(YYYY-MM-DD)를 키로 그룹핑, matchOrder → 시간 순 정렬
  const grouped = new Map<string, Match[]>();
  const sorted = [...matches].sort((a, b) => {
    const da = a.date ? a.date.slice(0, 10) : "9999-99-99";
    const db = b.date ? b.date.slice(0, 10) : "9999-99-99";
    if (da !== db) return da.localeCompare(db);
    return (a.matchOrder ?? 999) - (b.matchOrder ?? 999);
  });
  for (const m of sorted) {
    const key = m.date ? m.date.slice(0, 10) : "__none__";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(m);
  }

  return (
    <div className="space-y-6">
      {[...grouped.entries()].map(([dateKey, dayMatches]) => (
        <div key={dateKey}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-bold text-lg">
              {dateKey === "__none__" ? "일정 미정" : new Date(dateKey + "T00:00:00").toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
            </h3>
            <span className="text-sm text-gray-400">{dayMatches.length}경기</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="space-y-2">
            {dayMatches.map((m) => (
              <MatchCard key={m.id} match={m} showDate={false} showOrder />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 기수/조별 순위 뷰 ──────────────────────────────────
function DivisionView({ tournament }: { tournament: Tournament }) {
  const [activeGroup, setActiveGroup] = useState<string>(tournament.groups[0]?.id || "");

  if (tournament.groups.length === 0) {
    return (
      <div className="card p-12 text-center text-gray-400">
        <p>편성된 기수/조가 없습니다</p>
      </div>
    );
  }

  const group = tournament.groups.find((g) => g.id === activeGroup) || tournament.groups[0];
  const groupMatches = tournament.matches.filter((m) => m.group?.id === group.id);

  return (
    <div className="space-y-4">
      {/* Group Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tournament.groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={activeGroup === g.id
              ? { backgroundColor: (g.color || "#6366f1") + "99", color: "#111827", borderColor: g.color || "#6366f1", fontWeight: 700 }
              : { backgroundColor: (g.color || "#6366f1") + "22", color: "#6b7280", borderColor: "#e5e7eb" }
            }
          >
            {g.label || g.name}
          </button>
        ))}
      </div>

      {/* Standings */}
      <div className="card p-5">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color || "#6366f1" }} />
          <span>{group.label || group.name}</span>
          <span className="text-gray-500 font-normal text-base">순위표</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="text-left pb-2 font-medium w-6">#</th>
                <th className="text-left pb-2 font-medium pl-2">팀</th>
                <th className="text-center pb-2 font-medium px-2">경기</th>
                <th className="text-center pb-2 font-medium px-2">승</th>
                <th className="text-center pb-2 font-medium px-2">무</th>
                <th className="text-center pb-2 font-medium px-2">패</th>
                <th className="text-center pb-2 font-medium px-2">득</th>
                <th className="text-center pb-2 font-medium px-2">실</th>
                <th className="text-center pb-2 font-medium px-2">득실</th>
                <th className="text-center pb-2 font-bold px-2">승점</th>
              </tr>
            </thead>
            <tbody>
              {[...group.teams]
                .sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
                .map((gt, i) => (
                  <tr key={gt.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 text-gray-400 font-medium">{i + 1}</td>
                    <td className="py-2 pl-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: gt.team.color || "#3b82f6" }} />
                        <span className="font-medium">{gt.team.name}</span>
                      </div>
                    </td>
                    <td className="py-2 text-center px-2">{gt.played}</td>
                    <td className="py-2 text-center px-2">{gt.won}</td>
                    <td className="py-2 text-center px-2">{gt.drawn}</td>
                    <td className="py-2 text-center px-2">{gt.lost}</td>
                    <td className="py-2 text-center px-2">{gt.gf}</td>
                    <td className="py-2 text-center px-2">{gt.ga}</td>
                    <td className="py-2 text-center px-2 text-gray-500">{(gt.gf - gt.ga) > 0 ? `+${gt.gf - gt.ga}` : gt.gf - gt.ga}</td>
                    <td className="py-2 text-center px-2 font-bold text-blue-600">{gt.points}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matches of this group — grouped by date */}
      {groupMatches.length > 0 && (() => {
        const grouped = new Map<string, Match[]>();
        const sorted = [...groupMatches].sort((a, b) => {
          const da = a.date ? a.date.slice(0, 10) : "9999-99-99";
          const db = b.date ? b.date.slice(0, 10) : "9999-99-99";
          if (da !== db) return da.localeCompare(db);
          return (a.matchOrder ?? 999) - (b.matchOrder ?? 999);
        });
        for (const m of sorted) {
          const key = m.date ? m.date.slice(0, 10) : "__none__";
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(m);
        }
        return (
          <div className="card p-5">
            <h3 className="font-bold text-lg mb-4">{group.label || group.name} 경기 일정</h3>
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
                    {dayMatches.map((m) => <MatchCard key={m.id} match={m} showDate={false} showOrder />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── 공통 경기 카드 ──────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  SCHEDULED: { label: "예정",  cls: "bg-gray-100 text-gray-500",   dot: "bg-gray-400" },
  ONGOING:   { label: "진행중", cls: "bg-amber-100 text-amber-600", dot: "bg-amber-400" },
  FINISHED:  { label: "종료",  cls: "bg-green-100 text-green-600", dot: "bg-green-500" },
};

function MatchCard({ match, showDate, showOrder }: { match: Match; showDate: boolean; showOrder?: boolean }) {
  const finished = match.status === "FINISHED";
  const homeWin = finished && match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore;
  const awayWin = finished && match.homeScore != null && match.awayScore != null && match.awayScore > match.homeScore;
  const cfg = STATUS_CFG[match.status] ?? STATUS_CFG.SCHEDULED;
  const referees = [match.referee, match.assistantReferee1, match.assistantReferee2].filter(Boolean);

  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
      {/* meta row */}
      <div className="flex items-center gap-2 flex-wrap text-xs mb-3">
        {/* 경기 순서 번호 */}
        {showOrder && match.matchOrder != null && (
          <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 font-bold text-xs flex items-center justify-center flex-shrink-0">
            {match.matchOrder}
          </span>
        )}
        {/* 시간 — 날짜별 뷰에서는 시간만, 날짜 표시 뷰에서는 날짜+시간 */}
        {match.date && (
          <span className="font-semibold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full flex-shrink-0" suppressHydrationWarning>
            {showDate
              ? new Date(match.date).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
              : new Date(match.date).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        {match.group && (
          <span className="px-2 py-0.5 rounded-full font-medium text-gray-700" style={{ backgroundColor: (match.group.color || "#6366f1") + "33" }}>
            {match.group.label || match.group.name}
          </span>
        )}
        {match.round && <span className="text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{match.round}</span>}
        {match.court && <span className="text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">{match.court}</span>}
        {match.venue && !match.court && <span className="text-gray-400">{match.venue}</span>}
        {/* 상태 배지 — 오른쪽 정렬 */}
        <span className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold ${cfg.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Score row */}
      <div className="flex items-center justify-between gap-2">
        <div className={`flex-1 flex items-center justify-end gap-2 ${homeWin ? "text-blue-700" : ""}`}>
          <span className="font-semibold text-right">{match.homeTeam.name}</span>
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: match.homeTeam.color || "#3b82f6" }} />
        </div>
        <div className="flex items-center gap-2 min-w-[80px] justify-center">
          {finished ? (
            <>
              <span className={`text-2xl font-bold w-8 text-right ${homeWin ? "text-blue-700" : ""}`}>{match.homeScore}</span>
              <span className="text-gray-300 text-sm">:</span>
              <span className={`text-2xl font-bold w-8 text-left ${awayWin ? "text-blue-700" : ""}`}>{match.awayScore}</span>
            </>
          ) : (
            <span className="text-gray-300 font-medium text-sm">vs</span>
          )}
        </div>
        <div className={`flex-1 flex items-center gap-2 ${awayWin ? "text-blue-700" : ""}`}>
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: match.awayTeam.color || "#ef4444" }} />
          <span className="font-semibold">{match.awayTeam.name}</span>
        </div>
      </div>

      {/* Goals */}
      {match.goals.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-4 text-xs text-gray-400">
          <div className="flex-1 text-right">
            {match.goals
              .filter((g) => g.teamId === match.homeTeam.id)
              .map((g, i) => (
                <span key={i} className="ml-2">
                  {g.player?.name || "미상"}{g.minute ? ` ${g.minute}'` : ""}
                  {g.type === "OWN_GOAL" ? "(OG)" : g.type === "PENALTY" ? "(PK)" : ""}
                </span>
              ))}
          </div>
          <div className="flex-1">
            {match.goals
              .filter((g) => g.teamId === match.awayTeam.id)
              .map((g, i) => (
                <span key={i} className="mr-2">
                  {g.player?.name || "미상"}{g.minute ? ` ${g.minute}'` : ""}
                  {g.type === "OWN_GOAL" ? "(OG)" : g.type === "PENALTY" ? "(PK)" : ""}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Referees */}
      {referees.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
          {match.referee && <span>주심 {match.referee}</span>}
          {(match.assistantReferee1 || match.assistantReferee2) && (
            <span className="ml-3">부심 {[match.assistantReferee1, match.assistantReferee2].filter(Boolean).join(", ")}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── 리그 순위표 ──────────────────────────────────────────
function StandingsTable({ rows }: { rows: LeagueRow[] }) {
  if (rows.length === 0) return <p className="text-gray-400 text-center py-6">순위 정보 없음</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-2 pr-3 font-medium w-8">#</th>
            <th className="pb-2 pr-3 font-medium">팀</th>
            <th className="pb-2 px-2 text-center font-medium">경기</th>
            <th className="pb-2 px-2 text-center font-medium">승</th>
            <th className="pb-2 px-2 text-center font-medium">무</th>
            <th className="pb-2 px-2 text-center font-medium">패</th>
            <th className="pb-2 px-2 text-center font-medium">득</th>
            <th className="pb-2 px-2 text-center font-medium">실</th>
            <th className="pb-2 px-2 text-center font-medium">득실</th>
            <th className="pb-2 pl-2 text-center font-bold">승점</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.teamId} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 pr-3 text-gray-400 font-medium">{i + 1}</td>
              <td className="py-2 pr-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.team?.color || "#3b82f6" }} />
                  <span className="font-medium">{row.team?.name}</span>
                </div>
              </td>
              <td className="py-2 px-2 text-center">{row.played}</td>
              <td className="py-2 px-2 text-center">{row.won}</td>
              <td className="py-2 px-2 text-center">{row.drawn}</td>
              <td className="py-2 px-2 text-center">{row.lost}</td>
              <td className="py-2 px-2 text-center">{row.gf}</td>
              <td className="py-2 px-2 text-center">{row.ga}</td>
              <td className="py-2 px-2 text-center text-gray-500">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
              <td className="py-2 pl-2 text-center font-bold text-blue-600">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
