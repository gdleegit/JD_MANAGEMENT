"use client";

import { useState, useEffect } from "react";
import SaveButton from "./SaveButton";

type Player = { id: string; name: string; number?: number | null };
type Team = { id: string; name: string; shortName?: string | null; color?: string | null; players?: Player[] };
type Group = { id: string; name: string; label?: string | null; color?: string | null; teams: { id: string; team: { id: string } }[] };
type Tournament = { id: string; groups: Group[] };

export default function GolfEditor({ tournament }: { tournament: Tournament }) {
  const [venue, setVenue] = useState("");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [teamMap, setTeamMap] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tournaments/${tournament.id}/teams`).then((r) => r.json()),
      fetch(`/api/tournaments/${tournament.id}/golf`).then((r) => r.json()),
    ]).then(([teamsData, golfData]: [{ team: Team }[], { venue?: string; scores?: { playerId: string; strokes: number | null }[] } | null]) => {
      const map: Record<string, Team> = {};
      for (const tt of teamsData) map[tt.team.id] = tt.team;
      setTeamMap(map);
      if (golfData) {
        setVenue(golfData.venue ?? "");
        const sm: Record<string, string> = {};
        for (const s of golfData.scores ?? []) sm[s.playerId] = s.strokes?.toString() ?? "";
        setScores(sm);
      }
      setLoading(false);
    });
  }, [tournament.id]);

  const save = async () => {
    const scoreEntries: { playerId: string; teamId: string; strokes: number | null }[] = [];
    for (const team of Object.values(teamMap)) {
      for (const player of team.players ?? []) {
        const val = scores[player.id];
        scoreEntries.push({ playerId: player.id, teamId: team.id, strokes: val !== undefined && val !== "" ? parseInt(val) : null });
      }
    }
    await fetch(`/api/tournaments/${tournament.id}/golf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venue, scores: scoreEntries }),
    });
  };

  if (loading) return <div className="text-center py-12 text-gray-400">불러오는 중...</div>;

  const groups = tournament.groups.length > 0 ? tournament.groups : null;
  const ungroupedTeams = groups ? [] : Object.values(teamMap);

  return (
    <div className="space-y-4">
      {/* 골프장 */}
      <div className="card p-4">
        <label className="label">골프장</label>
        <input
          className="input mt-1"
          placeholder="예: 라이온스CC, 88CC"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
        />
      </div>

      {/* 타수 입력 */}
      <div className="card p-4 space-y-6">
        <h3 className="font-bold text-sm text-gray-700">선수별 타수 입력 (18홀 합계)</h3>

        {groups
          ? groups.map((group) => {
              const gTeams = group.teams.map((gt) => teamMap[gt.team.id]).filter(Boolean) as Team[];
              if (gTeams.length === 0) return null;
              return (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: group.color || "#6366f1" }} />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{group.label || group.name}</span>
                  </div>
                  {gTeams.map((team) => (
                    <TeamInput key={team.id} team={team} scores={scores} onChange={(pid, v) => setScores((p) => ({ ...p, [pid]: v }))} />
                  ))}
                </div>
              );
            })
          : ungroupedTeams.map((team) => (
              <TeamInput key={team.id} team={team} scores={scores} onChange={(pid, v) => setScores((p) => ({ ...p, [pid]: v }))} />
            ))}
      </div>

      <SaveButton onClick={save} label="저장" className="w-full" />
    </div>
  );
}

function TeamInput({ team, scores, onChange }: { team: Team; scores: Record<string, string>; onChange: (pid: string, val: string) => void }) {
  const players = [...(team.players ?? [])].sort((a, b) => {
    if (a.number != null && b.number != null) return a.number - b.number;
    if (a.number != null) return -1;
    if (b.number != null) return 1;
    return a.name.localeCompare(b.name, "ko");
  });
  if (players.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: team.color || "#3b82f6" }} />
        <span className="text-sm font-semibold text-gray-700">{team.name}</span>
        <span className="text-xs text-gray-400">({players.length}명)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {players.map((player) => (
          <div key={player.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">
              {player.number != null && <span className="text-gray-400 text-xs mr-1">{player.number}.</span>}
              {player.name}
            </span>
            <input
              type="number"
              min={18}
              max={200}
              className="input text-center text-sm font-bold py-1 w-20"
              placeholder="--"
              value={scores[player.id] ?? ""}
              onChange={(e) => onChange(player.id, e.target.value)}
            />
            <span className="text-xs text-gray-400 flex-shrink-0">타</span>
          </div>
        ))}
      </div>
    </div>
  );
}
