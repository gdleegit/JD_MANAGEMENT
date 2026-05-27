"use client";

import { useState, useEffect } from "react";
import SaveButton from "./SaveButton";

type Player = { id: string; name: string; number?: number | null };
type Team = { id: string; name: string; color?: string | null; players?: Player[] };
type Group = { id: string; name: string; label?: string | null; color?: string | null; teams: { id: string; team: { id: string } }[] };
type Tournament = { id: string; groups: Group[]; teams: { team: { id: string } }[] };

export default function GolfEditor({
  tournament,
  onCreateGroup,
  onAssignTeamToGroup,
  onDeleteGroup,
}: {
  tournament: Tournament;
  onCreateGroup: (name: string, label: string, color: string) => Promise<Group | null>;
  onAssignTeamToGroup: (teamId: string, groupId: string | null) => Promise<void>;
  onDeleteGroup: (groupId: string) => void;
}) {
  const [venue, setVenue] = useState("");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [teamMap, setTeamMap] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(true);

  // 리그 생성 폼
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({ name: "", color: "#6366f1" });
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

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

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("리그를 삭제하면 배정된 조도 모두 해제됩니다. 삭제할까요?")) return;
    setDeletingGroupId(groupId);
    await fetch(`/api/tournaments/${tournament.id}/groups/${groupId}`, { method: "DELETE" });
    onDeleteGroup(groupId);
    setDeletingGroupId(null);
  };

  const handleCreateGroup = async () => {
    if (!newGroupForm.name) return;
    setCreatingGroup(true);
    const g = await onCreateGroup(newGroupForm.name, newGroupForm.name, newGroupForm.color);
    if (g) setNewGroupForm({ name: "", color: "#6366f1" });
    setShowNewGroup(false);
    setCreatingGroup(false);
  };

  if (loading) return <div className="text-center py-12 text-gray-400">불러오는 중...</div>;

  // 미배정 팀 (어떤 그룹에도 속하지 않은 팀)
  const assignedTeamIds = new Set(tournament.groups.flatMap(g => g.teams.map(gt => gt.team.id)));
  const unassignedTeams = tournament.teams.filter(tt => !assignedTeamIds.has(tt.team.id)).map(tt => teamMap[tt.team.id]).filter(Boolean) as Team[];

  const groups = tournament.groups.length > 0 ? tournament.groups : null;
  const ungroupedTeams = groups ? [] : Object.values(teamMap);

  return (
    <div className="space-y-4">

      {/* 리그 편성 */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-700">리그 편성</h3>
          {!showNewGroup && (
            <button onClick={() => setShowNewGroup(true)} className="text-xs text-blue-600 hover:underline">
              + 리그 추가
            </button>
          )}
        </div>

        {/* 기존 리그 목록 */}
        {tournament.groups.length === 0 ? (
          <p className="text-sm text-gray-400">아직 리그가 없습니다. 위 "리그 추가" 버튼으로 만들어주세요.</p>
        ) : (
          <div className="space-y-1.5">
            {tournament.groups.map(g => {
              const gTeams = g.teams.map(gt => teamMap[gt.team.id]).filter(Boolean) as Team[];
              return (
                <div key={g.id} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: g.color || "#6366f1" }} />
                  <span className="font-semibold text-gray-700">{g.label || g.name}</span>
                  <span className="text-gray-400 text-xs flex-1">
                    {gTeams.length > 0 ? `${gTeams.length}개 조` : "팀 없음"}
                  </span>
                  <button
                    onClick={() => handleDeleteGroup(g.id)}
                    disabled={deletingGroupId === g.id}
                    className="text-red-400 hover:text-red-600 text-xs flex-shrink-0 disabled:opacity-40"
                  >
                    {deletingGroupId === g.id ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 미배정 팀 + 리그 배정 */}
        {unassignedTeams.length > 0 && tournament.groups.length > 0 && (
          <div className="pt-2 border-t border-gray-100 space-y-1.5">
            <p className="text-xs font-semibold text-amber-600">미배정 팀 ({unassignedTeams.length})</p>
            {unassignedTeams.map(team => (
              <div key={team.id} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: team.color || "#3b82f6" }} />
                <span className="text-sm text-gray-700 flex-1">{team.name}</span>
                <select
                  className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-white text-gray-600"
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) void onAssignTeamToGroup(team.id, e.target.value); }}
                >
                  <option value="">리그 선택</option>
                  {tournament.groups.map(g => (
                    <option key={g.id} value={g.id}>{g.label || g.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* 리그 생성 폼 */}
        {showNewGroup && (
          <div className="flex gap-2 items-center flex-wrap pt-2 border-t border-gray-100">
            <input
              className="input flex-1 min-w-40 text-sm"
              placeholder="리그명 (예: 73기 리그) *"
              value={newGroupForm.name}
              onChange={(e) => setNewGroupForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />
            <input
              type="color"
              className="h-9 w-12 rounded border border-gray-300 cursor-pointer flex-shrink-0"
              value={newGroupForm.color}
              onChange={(e) => setNewGroupForm(f => ({ ...f, color: e.target.value }))}
            />
            <button
              onClick={handleCreateGroup}
              disabled={!newGroupForm.name || creatingGroup}
              className="btn-primary btn-sm text-xs flex-shrink-0"
            >
              {creatingGroup ? "생성 중..." : "만들기"}
            </button>
            <button onClick={() => setShowNewGroup(false)} className="btn-secondary btn-sm text-xs flex-shrink-0">취소</button>
          </div>
        )}
      </div>

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
