"use client";

import { useState } from "react";
import BracketView from "./BracketView";

type Player = { id: string; name: string; number?: number | null; position?: string | null };
type Team = { id: string; name: string; color?: string | null; players: Player[] };
type Goal = { id: string; type: string; teamId: string; minute?: number | null; player?: { id: string; name: string } | null; team: Team };
type Group = { id: string; name: string; label?: string | null; teams: GroupTeam[] };
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
  group?: { id: string; name: string; label?: string | null } | null;
  matchOrder?: number | null;
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

  const [tab, setTab] = useState<"bracket" | "standings" | "division" | "schedule" | "teams" | "scorers">(defaultTab as "bracket");

  const tabs = [
    tournament.type === "KNOCKOUT" && { key: "bracket", label: "대진표" },
    tournament.type === "LEAGUE" && { key: "standings", label: "순위표" },
    tournament.type === "GROUP" && { key: "division", label: "기수별 순위" },
    { key: "schedule", label: "날짜별 일정" },
    { key: "scorers", label: "득점 순위" },
    { key: "teams", label: "참가팀" },
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
        <h1 className="text-3xl font-bold">{tournament.name}</h1>
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
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-800"}`}
          >
            {t.label}
          </button>
        ))}
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
      )}

      {/* Teams Tab */}
      {tab === "teams" && (
        <div>
          <h2 className="text-xl font-bold mb-4">참가 팀</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournament.teams.map(({ team }) => (
              <div key={team.id} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: team.color || "#3b82f6" }} />
                  <h3 className="font-bold">{team.name}</h3>
                </div>
                {team.players.length > 0 ? (
                  <div className="space-y-1">
                    {[...team.players]
                      .sort((a, b) => (a.number || 999) - (b.number || 999))
                      .map((p) => (
                        <div key={p.id} className="flex items-center gap-2 text-sm text-gray-600">
                          {p.number && <span className="w-6 text-right text-gray-400 text-xs">{p.number}</span>}
                          <span>{p.name}</span>
                          {p.position && <span className="text-xs text-gray-400">({p.position})</span>}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">선수 정보 없음</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 날짜별 일정 뷰 ──────────────────────────────────────
function ScheduleView({ matches }: { matches: Match[] }) {
  const MATCH_STATUS: Record<string, string> = { SCHEDULED: "예정", ONGOING: "진행중", FINISHED: "종료" };
  const STATUS_CLS: Record<string, string> = { SCHEDULED: "badge-gray", ONGOING: "badge-yellow", FINISHED: "badge-green" };

  // 날짜 없는 경기 분리
  const withDate = matches.filter((m) => m.date);
  const noDate = matches.filter((m) => !m.date);

  // 날짜별 그룹
  const byDate: Record<string, Match[]> = {};
  for (const m of withDate) {
    const day = new Date(m.date!).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
    if (!byDate[day]) byDate[day] = [];
    byDate[day].push(m);
  }

  const sortedDates = Object.keys(byDate).sort((a, b) => {
    const da = new Date(byDate[a][0].date!);
    const db = new Date(byDate[b][0].date!);
    return da.getTime() - db.getTime();
  });

  if (matches.length === 0) {
    return (
      <div className="card p-12 text-center text-gray-400">
        <p>등록된 경기가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((day) => (
        <div key={day}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-bold text-lg">{day}</h3>
            <span className="text-sm text-gray-400">{byDate[day].length}경기</span>
          </div>
          <div className="space-y-2">
            {byDate[day].map((m) => (
              <MatchCard key={m.id} match={m} showDate={false} />
            ))}
          </div>
        </div>
      ))}

      {noDate.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-3 text-gray-400">일정 미정</h3>
          <div className="space-y-2">
            {noDate.map((m) => <MatchCard key={m.id} match={m} showDate={false} />)}
          </div>
        </div>
      )}
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
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${activeGroup === g.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
          >
            {g.label || g.name}
          </button>
        ))}
      </div>

      {/* Standings */}
      <div className="card p-5">
        <h3 className="font-bold text-lg mb-4">{group.label || group.name} 순위표</h3>
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

      {/* Matches of this group */}
      {groupMatches.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-lg mb-4">{group.label || group.name} 경기 결과</h3>
          <div className="space-y-2">
            {groupMatches.map((m) => <MatchCard key={m.id} match={m} showDate />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 공통 경기 카드 ──────────────────────────────────────
function MatchCard({ match, showDate }: { match: Match; showDate: boolean }) {
  const finished = match.status === "FINISHED";
  const homeWin = finished && match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore;
  const awayWin = finished && match.homeScore != null && match.awayScore != null && match.awayScore > match.homeScore;

  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
      {/* meta */}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
        {match.group && <span className="font-medium text-blue-500">{match.group.label || match.group.name}</span>}
        {match.round && <span>{match.round}</span>}
        {showDate && match.date && (
          <span>{new Date(match.date).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        )}
        {!showDate && match.date && (
          <span>{new Date(match.date).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
        )}
        {match.court && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{match.court}</span>}
        {match.venue && !match.court && <span>{match.venue}</span>}
        <span className={`ml-auto ${match.status === "FINISHED" ? "badge-green" : match.status === "ONGOING" ? "badge-yellow" : "badge-gray"}`}>
          {match.status === "FINISHED" ? "종료" : match.status === "ONGOING" ? "진행중" : "예정"}
        </span>
      </div>

      {/* Score row */}
      <div className="flex items-center justify-between gap-2">
        <span className={`flex-1 text-right font-semibold ${homeWin ? "text-blue-700" : ""}`}>{match.homeTeam.name}</span>
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
        <span className={`flex-1 font-semibold ${awayWin ? "text-blue-700" : ""}`}>{match.awayTeam.name}</span>
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
