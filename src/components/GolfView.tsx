"use client";

import { useState, useEffect } from "react";

type Player = { id: string; name: string; number?: number | null };
type Team = { id: string; name: string; shortName?: string | null; color?: string | null; players?: Player[] };
type Group = { id: string; name: string; label?: string | null; color?: string | null; teams: { id: string; team: { id: string } }[] };
type Tournament = { id: string; groups: Group[]; teams: { team: { id: string } }[] };
type GolfScore = { playerId: string; strokes: number | null };
type GolfData = { venue?: string | null; scores?: GolfScore[] } | null;

export default function GolfView({ tournament }: { tournament: Tournament }) {
  const [tab, setTab] = useState<"leaderboard" | "scorecard">("leaderboard");
  const [teamMap, setTeamMap] = useState<Record<string, Team>>({});
  const [golfData, setGolfData] = useState<GolfData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tournaments/${tournament.id}/teams`).then((r) => r.json()),
      fetch(`/api/tournaments/${tournament.id}/golf`).then((r) => r.json()),
    ]).then(([teamsData, golf]: [{ team: Team }[], GolfData]) => {
      const map: Record<string, Team> = {};
      for (const tt of teamsData) map[tt.team.id] = tt.team;
      setTeamMap(map);
      setGolfData(golf);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tournament.id]);

  if (loading) return <div className="text-center py-12 text-gray-400">불러오는 중...</div>;

  const scoreMap: Record<string, number | null> = {};
  for (const s of golfData?.scores ?? []) scoreMap[s.playerId] = s.strokes;

  // Build group → teams → players structure
  const groups = tournament.groups.length > 0 ? tournament.groups : null;

  return (
    <div className="space-y-4">
      {/* venue banner */}
      {golfData?.venue && (
        <div className="card px-4 py-3 flex items-center gap-2">
          <span className="text-lg">⛳</span>
          <span className="font-semibold text-gray-700">{golfData.venue}</span>
          <span className="text-xs text-gray-400 ml-1">· 18홀 1라운드 스트로크플레이</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "leaderboard", label: "리그별 순위" },
          { key: "scorecard", label: "팀별 스코어카드" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "leaderboard" && (
        <LeaderboardTab groups={groups} teamMap={teamMap} scoreMap={scoreMap} />
      )}
      {tab === "scorecard" && (
        <ScorecardTab groups={groups} teamMap={teamMap} scoreMap={scoreMap} tournamentTeams={tournament.teams} />
      )}
    </div>
  );
}

// ── 리그별 조편성 ──────────────────────────────────────────────
function LeaderboardTab({ groups, teamMap, scoreMap }: {
  groups: Group[] | null;
  teamMap: Record<string, Team>;
  scoreMap: Record<string, number | null>;
}) {
  const sortedTeams = (teams: Team[]) =>
    [...teams].sort((a, b) => {
      const na = parseInt(a.name);
      const nb = parseInt(b.name);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.name.localeCompare(b.name, "ko");
    });

  if (!groups) {
    const allTeams = sortedTeams(Object.values(teamMap));
    return (
      <div className="card p-4 sm:p-5">
        <h3 className="font-bold mb-4">전체 조편성</h3>
        <GroupTable teams={allTeams} scoreMap={scoreMap} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const gTeams = sortedTeams(group.teams.map((gt) => teamMap[gt.team.id]).filter(Boolean) as Team[]);
        return (
          <div key={group.id} className="card p-4 sm:p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.color || "#6366f1" }} />
              {group.label || group.name}
              <span className="text-gray-400 font-normal text-sm">⛳ {gTeams.length}개 조</span>
            </h3>
            {gTeams.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">배정된 조가 없습니다</p>
            ) : (
              <GroupTable teams={gTeams} scoreMap={scoreMap} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function GroupTable({ teams, scoreMap }: { teams: Team[]; scoreMap: Record<string, number | null> }) {
  return (
    <div className="space-y-2">
      {teams.map((team) => {
        const players = [...(team.players ?? [])].sort((a, b) => {
          if (a.number != null && b.number != null) return a.number - b.number;
          if (a.number != null) return -1;
          if (b.number != null) return 1;
          return a.name.localeCompare(b.name, "ko");
        });
        const shortName = team.shortName;
        return (
          <div key={team.id} className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
            {/* 조 이름 */}
            <div className="flex-shrink-0 w-16 flex flex-col items-center pt-0.5">
              <span className="text-sm font-bold text-gray-800">{team.name}</span>
              {shortName && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 mt-0.5 whitespace-nowrap">{shortName}</span>
              )}
            </div>
            {/* 선수들 가로 나열 */}
            <div className="flex flex-wrap gap-2 flex-1">
              {players.map((player) => {
                const strokes = scoreMap[player.id] ?? null;
                return (
                  <div key={player.id} className="flex flex-col items-center bg-gray-50 rounded-xl px-3 py-2 min-w-[64px]">
                    <span className="text-xs font-bold text-gray-800 text-center leading-tight">{player.name}</span>
                    {player.number != null && (
                      <span className="text-[10px] text-gray-400 mt-0.5">{player.number}회</span>
                    )}
                    {strokes != null ? (
                      <span className="text-sm font-black text-blue-600 mt-1 tabular-nums">{strokes}타</span>
                    ) : (
                      <span className="text-[10px] text-gray-300 mt-1">미기록</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 팀별 스코어카드 ──────────────────────────────────────────
function ScorecardTab({ groups, teamMap, scoreMap, tournamentTeams }: {
  groups: Group[] | null;
  teamMap: Record<string, Team>;
  scoreMap: Record<string, number | null>;
  tournamentTeams: { team: { id: string } }[];
}) {
  const allTeams = tournamentTeams.map((tt) => teamMap[tt.team.id]).filter(Boolean) as Team[];
  const [selectedTeamId, setSelectedTeamId] = useState<string>(allTeams[0]?.id ?? "");

  const selectedTeam = teamMap[selectedTeamId];

  // Group label for selected team
  let groupLabel: string | null = null;
  if (groups) {
    for (const g of groups) {
      if (g.teams.some((gt) => gt.team.id === selectedTeamId)) {
        groupLabel = g.label || g.name;
        break;
      }
    }
  }

  const players = [...(selectedTeam?.players ?? [])].sort((a, b) => {
    if (a.number != null && b.number != null) return a.number - b.number;
    if (a.number != null) return -1;
    if (b.number != null) return 1;
    return a.name.localeCompare(b.name, "ko");
  });

  const teamTotal = players.reduce((sum, p) => {
    const s = scoreMap[p.id];
    return s != null ? sum + s : sum;
  }, 0);
  const scoredCount = players.filter((p) => scoreMap[p.id] != null).length;

  return (
    <div className="space-y-4">
      {/* Team selector */}
      <div className="card p-4">
        <label className="label mb-2 block">팀 선택</label>
        <div className="flex flex-wrap gap-2">
          {allTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                selectedTeamId === team.id
                  ? "border-transparent text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
              style={selectedTeamId === team.id ? { backgroundColor: team.color || "#3b82f6" } : {}}
            >
              {team.name}
            </button>
          ))}
        </div>
      </div>

      {/* Scorecard */}
      {selectedTeam && (
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selectedTeam.color || "#3b82f6" }} />
            <h3 className="font-bold text-base">{selectedTeam.name}</h3>
            {groupLabel && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{groupLabel}</span>
            )}
          </div>

          {players.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">등록된 선수가 없습니다</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {players.map((player) => {
                  const strokes = scoreMap[player.id] ?? null;
                  return (
                    <div key={player.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      {player.number != null && (
                        <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{player.number}.</span>
                      )}
                      <span className="text-sm font-medium text-gray-800 flex-1">{player.name}</span>
                      <div className="flex items-baseline gap-1">
                        {strokes != null ? (
                          <>
                            <span className="text-lg font-black text-gray-800 tabular-nums">{strokes}</span>
                            <span className="text-xs text-gray-400">타</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-300 font-medium">미기록</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Team total */}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  팀 합계 <span className="text-xs text-gray-400">({scoredCount}/{players.length}명 기록)</span>
                </span>
                {scoredCount > 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900 tabular-nums">{teamTotal}</span>
                    <span className="text-sm text-gray-400">타</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-300">-</span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
