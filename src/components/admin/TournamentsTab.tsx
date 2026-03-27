"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TournamentEditor from "./TournamentEditor";

type Tournament = { id: string; name: string; type: string; status: string; _count: { teams: number; matches: number } };

const STATUS_LABELS: Record<string, string> = { UPCOMING: "예정", ONGOING: "진행중", FINISHED: "종료" };
const TYPE_LABELS: Record<string, string> = { KNOCKOUT: "토너먼트", LEAGUE: "리그", GROUP: "조별리그" };

export default function TournamentsTab({ initialTournaments }: { initialTournaments: Tournament[] }) {
  const router = useRouter();
  const [tournaments, setTournaments] = useState(initialTournaments);
  const [form, setForm] = useState({ name: "", type: "KNOCKOUT", startDate: "", endDate: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const createTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      const t = await res.json();
      setTournaments([{ ...t, _count: { teams: 0, matches: 0 } }, ...tournaments]);
      setForm({ name: "", type: "KNOCKOUT", startDate: "", endDate: "", description: "" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const deleteTournament = async (id: string) => {
    if (!confirm("대회를 삭제하면 모든 경기와 결과가 삭제됩니다. 계속할까요?")) return;
    await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
    setTournaments(tournaments.filter((t) => t.id !== id));
  };

  if (editingId) {
    return <TournamentEditor tournamentId={editingId} onBack={() => { setEditingId(null); router.refresh(); }} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create Form */}
      <div className="lg:col-span-1">
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4">대회 추가</h2>
          <form onSubmit={createTournament} className="space-y-3">
            <div>
              <label className="label">대회명 *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="예: 2024 봄 토너먼트" />
            </div>
            <div>
              <label className="label">대회 유형 *</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="KNOCKOUT">토너먼트 (녹아웃)</option>
                <option value="LEAGUE">리그전</option>
                <option value="GROUP">조별리그</option>
              </select>
            </div>
            <div>
              <label className="label">시작일</label>
              <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">종료일</label>
              <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div>
              <label className="label">설명</label>
              <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="대회 설명 (선택)" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? "추가 중..." : "대회 추가"}</button>
          </form>
        </div>
      </div>

      {/* Tournament List */}
      <div className="lg:col-span-2">
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4">대회 목록 ({tournaments.length})</h2>
          {tournaments.length === 0 ? (
            <p className="text-gray-400 text-center py-6">등록된 대회가 없습니다</p>
          ) : (
            <div className="space-y-3">
              {tournaments.map((t) => (
                <div key={t.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{t.name}</h3>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{TYPE_LABELS[t.type]}</span>
                        <span className="text-xs text-gray-500">{STATUS_LABELS[t.status]}</span>
                      </div>
                      <p className="text-sm text-gray-500">팀 {t._count.teams}개 · 경기 {t._count.matches}개</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/tournaments/${t.id}`} target="_blank" className="btn btn-secondary btn-sm text-xs">보기</Link>
                      <button onClick={() => setEditingId(t.id)} className="btn-primary btn-sm text-xs">편집</button>
                      <button onClick={() => deleteTournament(t.id)} className="btn-danger btn-sm text-xs">삭제</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
