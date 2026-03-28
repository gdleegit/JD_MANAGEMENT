"use client";

import { useState, useEffect, useRef } from "react";

type Player = { id: string; name: string; number?: number | null; position?: string | null };
type DraftRow = { key: string; name: string; number: string; position: string };

const POSITIONS = ["GK", "DF", "MF", "FW"];
const newRow = (): DraftRow => ({ key: Math.random().toString(36).slice(2), name: "", number: "", position: "" });

export default function PlayerManager({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [fetching, setFetching] = useState(true);
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // 단일 추가 폼
  const [form, setForm] = useState({ name: "", number: "", position: "" });
  const [adding, setAdding] = useState(false);

  // 일괄 추가 rows
  const [rows, setRows] = useState<DraftRow[]>([newRow()]);
  const [saving, setSaving] = useState(false);
  const lastRowRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFetching(true);
    fetch(`/api/teams/${teamId}`)
      .then((r) => r.json())
      .then((data) => setPlayers(data.players || []))
      .finally(() => setFetching(false));
  }, [teamId]);

  const addSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) return;
      const player = await res.json();
      setPlayers((prev) => [...prev, player]);
      setForm({ name: "", number: "", position: "" });
    } finally {
      setAdding(false);
    }
  };

  const saveBulk = async () => {
    const valid = rows.filter((r) => r.name.trim());
    if (!valid.length) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: valid }),
      });
      if (!res.ok) return;
      const created: Player[] = await res.json();
      setPlayers((prev) => [...prev, ...created]);
      setRows([newRow()]);
    } finally {
      setSaving(false);
    }
  };

  const updateRow = (key: string, field: keyof Omit<DraftRow, "key">, value: string) =>
    setRows((prev) => prev.map((r) => r.key === key ? { ...r, [field]: value } : r));

  const removeRow = (key: string) =>
    setRows((prev) => prev.length > 1 ? prev.filter((r) => r.key !== key) : [newRow()]);

  const addRow = () => {
    setRows((prev) => [...prev, newRow()]);
    setTimeout(() => lastRowRef.current?.focus(), 50);
  };

  const deletePlayer = async (id: string) => {
    await fetch(`/api/players/${id}`, { method: "DELETE" });
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const validCount = rows.filter((r) => r.name.trim()).length;
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.number && b.number) return a.number - b.number;
    if (a.number) return -1;
    if (b.number) return 1;
    return a.name.localeCompare(b.name, "ko", { numeric: true });
  });

  return (
    <div>
      {fetching ? (
        <p className="text-gray-400 text-sm py-2">불러오는 중...</p>
      ) : (
        <div className="space-y-4">
          {/* 모드 토글 */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {(["single", "bulk"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${mode === m ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                {m === "single" ? "단일 추가" : "일괄 추가"}
              </button>
            ))}
          </div>

          {/* 단일 추가 폼 */}
          {mode === "single" && (
            <form onSubmit={addSingle} className="flex flex-wrap gap-2">
              <input className="input flex-1 min-w-32" placeholder="선수 이름 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input w-20" type="number" placeholder="번호" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
              <select className="input w-24" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                <option value="">포지션</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button type="submit" className="btn-primary btn-sm" disabled={adding}>{adding ? "추가중" : "추가"}</button>
            </form>
          )}

          {/* 일괄 추가 폼 */}
          {mode === "bulk" && (
            <div className="space-y-2">
              <div className="space-y-1.5">
                {rows.map((row, idx) => (
                  <div key={row.key} className="flex gap-1.5 items-center">
                    <span className="text-xs text-gray-300 w-4 text-right flex-shrink-0">{idx + 1}</span>
                    <input
                      className="input w-16 text-sm"
                      type="number"
                      placeholder="번호"
                      value={row.number}
                      onChange={(e) => updateRow(row.key, "number", e.target.value)}
                    />
                    <input
                      ref={idx === rows.length - 1 ? lastRowRef : undefined}
                      className="input flex-1 min-w-0 text-sm"
                      placeholder="이름 *"
                      value={row.name}
                      onChange={(e) => updateRow(row.key, "name", e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRow(); } }}
                    />
                    <select
                      className="input w-20 text-sm"
                      value={row.position}
                      onChange={(e) => updateRow(row.key, "position", e.target.value)}
                    >
                      <option value="">포지션</option>
                      {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button onClick={() => removeRow(row.key)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 text-sm px-1">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1">
                <button onClick={addRow} className="text-xs text-blue-600 hover:underline">+ 행 추가 <span className="text-gray-400">(Enter)</span></button>
                <button
                  onClick={saveBulk}
                  disabled={saving || validCount === 0}
                  className="btn-primary btn-sm"
                >
                  {saving ? "저장 중..." : `${validCount}명 저장`}
                </button>
              </div>
            </div>
          )}

          {/* 선수 목록 */}
          {players.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">등록된 선수가 없습니다</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedPlayers.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-6 text-right">{p.number ?? ""}</span>
                    <span className="font-medium text-sm">{p.name}</span>
                    {p.position && <span className="badge badge-blue">{p.position}</span>}
                  </div>
                  <button onClick={() => deletePlayer(p.id)} className="text-red-400 hover:text-red-600 text-xs">삭제</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
