"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TournamentEditor from "./TournamentEditor";

type Tournament = { id: string; name: string; sport: string; type: string; status: string; _count: { teams: number; matches: number } };

const STATUS_LABELS: Record<string, string> = { UPCOMING: "예정", ONGOING: "진행중", FINISHED: "종료" };
const STATUS_BADGE: Record<string, string> = { UPCOMING: "badge badge-gray", ONGOING: "badge badge-yellow", FINISHED: "badge badge-green" };
const TYPE_LABELS: Record<string, string> = { KNOCKOUT: "토너먼트", LEAGUE: "리그", GROUP: "조별·기수 리그" };
const TYPE_BADGE: Record<string, string> = { KNOCKOUT: "badge badge-blue", LEAGUE: "badge badge-blue", GROUP: "badge badge-blue" };
export const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: "축구", BASKETBALL: "농구", VOLLEYBALL: "배구",
  BASEBALL: "야구", FUTSAL: "풋살", BADMINTON: "배드민턴",
  TABLE_TENNIS: "탁구", TENNIS: "테니스",
  BILLIARDS: "당구", GOLF: "골프",
};
export const SPORT_EMOJI: Record<string, string> = {
  FOOTBALL: "⚽", BASKETBALL: "🏀", VOLLEYBALL: "🏐",
  BASEBALL: "⚾", FUTSAL: "⚽", BADMINTON: "🏸",
  TABLE_TENNIS: "🏓", TENNIS: "🎾",
  BILLIARDS: "🎱", GOLF: "⛳",
};

export default function TournamentsTab({ initialTournaments }: { initialTournaments: Tournament[] }) {
  const router = useRouter();
  const [tournaments, setTournaments] = useState(initialTournaments);
  const [form, setForm] = useState({ name: "", sport: "FOOTBALL", type: "KNOCKOUT", startDate: "", endDate: "", description: "" });
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
      setForm({ name: "", sport: "FOOTBALL", type: "KNOCKOUT", startDate: "", endDate: "", description: "" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const deleteTournament = async (id: string) => {
    if (!confirm("대회를 목록에서 숨깁니다. 데이터는 유지되며 DB에서 직접 삭제할 수 있습니다. 계속할까요?")) return;
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
              <label className="label">종목 *</label>
              <select className="input" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
                {Object.entries(SPORT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{SPORT_EMOJI[v]} {l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">대회 유형 *</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="KNOCKOUT">토너먼트 (녹아웃)</option>
                <option value="LEAGUE">리그전</option>
                <option value="GROUP">조별·기수 리그</option>
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
                <div key={t.id} className={`border rounded-xl p-4 hover:bg-gray-50 transition-colors ${
                  t.status === "ONGOING" ? "border-l-4 border-l-amber-400 border-amber-100" :
                  t.status === "FINISHED" ? "border-l-4 border-l-green-400 border-green-100" :
                  "border-gray-100"
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="font-bold truncate">{t.name}</h3>
                        <span className="badge badge-gray">{SPORT_EMOJI[t.sport]} {SPORT_LABELS[t.sport] ?? t.sport}</span>
                        <span className={TYPE_BADGE[t.type] || "badge badge-blue"}>{TYPE_LABELS[t.type]}</span>
                        <span className={STATUS_BADGE[t.status] || "badge badge-gray"}>{STATUS_LABELS[t.status]}</span>
                      </div>
                      <p className="text-sm text-gray-400">팀 {t._count.teams}개 · 경기 {t._count.matches}개</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Link href={`/tournaments/${t.id}`} target="_blank" className="btn btn-secondary btn-sm text-xs" title="공개 페이지 보기">↗ 보기</Link>
                      <button onClick={() => setEditingId(t.id)} className="btn btn-primary btn-sm text-xs">편집</button>
                      <button onClick={() => deleteTournament(t.id)} className="btn btn-danger btn-sm text-xs">삭제</button>
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
