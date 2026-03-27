"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PlayerManager from "./PlayerManager";

type Team = { id: string; name: string; shortName?: string | null; color?: string | null; _count: { players: number } };

export default function TeamsTab({ initialTeams }: { initialTeams: Team[] }) {
  const router = useRouter();
  const [teams, setTeams] = useState(initialTeams);
  const [form, setForm] = useState({ name: "", shortName: "", color: "#3b82f6" });
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [error, setError] = useState("");

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      const team = await res.json();
      setTeams([...teams, { ...team, _count: { players: 0 } }]);
      setForm({ name: "", shortName: "", color: "#3b82f6" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm("팀을 삭제하면 선수 정보도 모두 삭제됩니다. 계속할까요?")) return;
    await fetch(`/api/teams/${id}`, { method: "DELETE" });
    setTeams(teams.filter((t) => t.id !== id));
    if (selectedTeam?.id === id) setSelectedTeam(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create Form */}
      <div className="lg:col-span-1">
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4">팀 추가</h2>
          <form onSubmit={createTeam} className="space-y-3">
            <div>
              <label className="label">팀 이름 *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="예: 서울 FC" />
            </div>
            <div>
              <label className="label">약칭</label>
              <input className="input" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} placeholder="예: SEO" />
            </div>
            <div>
              <label className="label">팀 색상</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-9 w-16 rounded border border-gray-300 cursor-pointer" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                <span className="text-sm text-gray-500">{form.color}</span>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? "추가 중..." : "팀 추가"}</button>
          </form>
        </div>
      </div>

      {/* Teams List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4">팀 목록 ({teams.length})</h2>
          {teams.length === 0 ? (
            <p className="text-gray-400 text-center py-6">등록된 팀이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {teams.map((team) => (
                <div key={team.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedTeam?.id === team.id ? "border-blue-300 bg-blue-50" : "border-gray-100 hover:bg-gray-50"}`}
                  onClick={() => setSelectedTeam(selectedTeam?.id === team.id ? null : team)}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color || "#3b82f6" }} />
                    <span className="font-medium">{team.name}</span>
                    {team.shortName && <span className="text-xs text-gray-400">({team.shortName})</span>}
                    <span className="text-xs text-gray-400">선수 {team._count.players}명</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteTeam(team.id); }} className="btn-danger btn-sm text-xs">삭제</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedTeam && (
          <PlayerManager teamId={selectedTeam.id} teamName={selectedTeam.name} />
        )}
      </div>
    </div>
  );
}
