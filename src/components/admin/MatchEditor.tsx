"use client";

import { useState } from "react";

type Player = { id: string; name: string; number?: number | null };
type Team = { id: string; name: string; color?: string | null; players: Player[] };
type Goal = { id: string; type: string; teamId: string; minute?: number | null; player?: Player | null; team: Team };
type Match = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  date?: string | null;
  venue?: string | null;
  round?: string | null;
  status: string;
  goals: Goal[];
};
type Tournament = { id: string; name: string; type: string };

const GOAL_TYPES = [
  { value: "GOAL", label: "일반골" },
  { value: "PENALTY", label: "PK" },
  { value: "OWN_GOAL", label: "자책골" },
];

export default function MatchEditor({ match, tournament, onBack }: { match: Match; tournament: Tournament; onBack: () => void }) {
  const [currentMatch, setCurrentMatch] = useState(match);
  const [status, setStatus] = useState(match.status);
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [goalForm, setGoalForm] = useState({ teamId: match.homeTeam.id, playerId: "", minute: "", type: "GOAL" });
  const [addingGoal, setAddingGoal] = useState(false);

  const saveResult = async () => {
    setSaving(true);
    const res = await fetch(`/api/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        homeScore: homeScore !== "" ? parseInt(homeScore) : null,
        awayScore: awayScore !== "" ? parseInt(awayScore) : null,
      }),
    });
    const updated = await res.json();
    setCurrentMatch({ ...currentMatch, ...updated });
    setSaving(false);
  };

  const addGoal = async () => {
    setAddingGoal(true);
    const res = await fetch(`/api/matches/${match.id}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId: goalForm.teamId,
        playerId: goalForm.playerId || null,
        minute: goalForm.minute ? parseInt(goalForm.minute) : null,
        type: goalForm.type,
      }),
    });
    const goal = await res.json();

    // Refresh match scores
    const matchRes = await fetch(`/api/matches/${match.id}`);
    const updated = await matchRes.json();
    setCurrentMatch(updated);
    setHomeScore(updated.homeScore?.toString() ?? "");
    setAwayScore(updated.awayScore?.toString() ?? "");
    setGoalForm({ teamId: match.homeTeam.id, playerId: "", minute: "", type: "GOAL" });
    setAddingGoal(false);
  };

  const deleteGoal = async (goalId: string) => {
    await fetch(`/api/matches/${match.id}/goals`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId }),
    });
    const matchRes = await fetch(`/api/matches/${match.id}`);
    const updated = await matchRes.json();
    setCurrentMatch(updated);
    setHomeScore(updated.homeScore?.toString() ?? "");
    setAwayScore(updated.awayScore?.toString() ?? "");
  };

  const selectedTeam = goalForm.teamId === match.homeTeam.id ? match.homeTeam : match.awayTeam;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="btn-secondary btn-sm">← 경기 목록</button>
        <h3 className="font-bold text-lg">{match.homeTeam.name} vs {match.awayTeam.name}</h3>
        {match.round && <span className="text-sm text-gray-400">{match.round}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score & Status */}
        <div className="card p-5">
          <h4 className="font-bold mb-4">경기 결과</h4>
          <div className="space-y-3">
            <div>
              <label className="label">상태</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="SCHEDULED">예정</option>
                <option value="ONGOING">진행중</option>
                <option value="FINISHED">종료</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="label">{match.homeTeam.name} (홈)</label>
                <input type="number" min="0" className="input text-center text-xl font-bold" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} />
              </div>
              <div className="text-2xl text-gray-300 pt-5">-</div>
              <div className="flex-1">
                <label className="label">{match.awayTeam.name} (어웨이)</label>
                <input type="number" min="0" className="input text-center text-xl font-bold" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} />
              </div>
            </div>
            <button onClick={saveResult} className="btn-primary w-full" disabled={saving}>{saving ? "저장 중..." : "결과 저장"}</button>
          </div>
        </div>

        {/* Add Goal */}
        <div className="card p-5">
          <h4 className="font-bold mb-4">득점 기록 추가</h4>
          <div className="space-y-3">
            <div>
              <label className="label">팀</label>
              <select className="input" value={goalForm.teamId} onChange={(e) => setGoalForm({ ...goalForm, teamId: e.target.value, playerId: "" })}>
                <option value={match.homeTeam.id}>{match.homeTeam.name}</option>
                <option value={match.awayTeam.id}>{match.awayTeam.name}</option>
              </select>
            </div>
            <div>
              <label className="label">선수</label>
              <select className="input" value={goalForm.playerId} onChange={(e) => setGoalForm({ ...goalForm, playerId: e.target.value })}>
                <option value="">미상</option>
                {selectedTeam.players.map((p) => (
                  <option key={p.id} value={p.id}>{p.number ? `${p.number}. ` : ""}{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="label">분</label>
                <input type="number" min="1" max="120" className="input" placeholder="예: 45" value={goalForm.minute} onChange={(e) => setGoalForm({ ...goalForm, minute: e.target.value })} />
              </div>
              <div className="flex-1">
                <label className="label">유형</label>
                <select className="input" value={goalForm.type} onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value })}>
                  {GOAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <button onClick={addGoal} className="btn-primary w-full" disabled={addingGoal}>{addingGoal ? "추가 중..." : "득점 추가"}</button>
          </div>
        </div>
      </div>

      {/* Goals List */}
      {currentMatch.goals.length > 0 && (
        <div className="card p-5">
          <h4 className="font-bold mb-3">득점 기록</h4>
          <div className="space-y-2">
            {currentMatch.goals
              .sort((a, b) => (a.minute || 999) - (b.minute || 999))
              .map((g) => (
                <div key={g.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.team.color || "#3b82f6" }} />
                    <span className="text-sm font-medium">{g.team.name}</span>
                    <span className="text-sm">{g.player?.name || "미상"}</span>
                    {g.minute && <span className="text-xs text-gray-400">{g.minute}&apos;</span>}
                    {g.type !== "GOAL" && (
                      <span className="badge badge-yellow text-xs">{g.type === "OWN_GOAL" ? "자책" : "PK"}</span>
                    )}
                  </div>
                  <button onClick={() => deleteGoal(g.id)} className="text-red-500 text-xs hover:text-red-700">삭제</button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
