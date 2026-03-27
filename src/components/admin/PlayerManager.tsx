"use client";

import { useState, useEffect } from "react";

type Player = { id: string; name: string; number?: number | null; position?: string | null };

const POSITIONS = ["GK", "DF", "MF", "FW"];

export default function PlayerManager({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [form, setForm] = useState({ name: "", number: "", position: "" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    setFetching(true);
    fetch(`/api/teams/${teamId}`)
      .then((r) => r.json())
      .then((data) => { setPlayers(data.players || []); })
      .finally(() => setFetching(false));
  }, [teamId]);

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) return;
      const player = await res.json();
      setPlayers([...players, player]);
      setForm({ name: "", number: "", position: "" });
    } finally {
      setLoading(false);
    }
  };

  const deletePlayer = async (id: string) => {
    await fetch(`/api/players/${id}`, { method: "DELETE" });
    setPlayers(players.filter((p) => p.id !== id));
  };

  return (
    <div className="card p-5">
      <h3 className="font-bold text-lg mb-4">{teamName} 선수 명단</h3>
      {fetching ? (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      ) : (
        <>
          {/* Add Player Form */}
          <form onSubmit={addPlayer} className="flex flex-wrap gap-2 mb-4">
            <input
              className="input flex-1 min-w-32"
              placeholder="선수 이름 *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="input w-20"
              type="number"
              placeholder="번호"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
            />
            <select
              className="input w-24"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            >
              <option value="">포지션</option>
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="submit" className="btn-primary btn-sm" disabled={loading}>추가</button>
          </form>

          {/* Players List */}
          {players.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">등록된 선수가 없습니다</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {players
                .sort((a, b) => (a.number || 999) - (b.number || 999))
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      {p.number && <span className="text-sm text-gray-400 w-6 text-right">{p.number}</span>}
                      <span className="font-medium text-sm">{p.name}</span>
                      {p.position && <span className="badge badge-blue">{p.position}</span>}
                    </div>
                    <button onClick={() => deletePlayer(p.id)} className="text-red-500 hover:text-red-700 text-xs">삭제</button>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
