"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TournamentEditor from "./TournamentEditor";

type Tournament = { id: string; name: string; sport: string; type: string; status: string; _count: { teams: number; matches: number } };

const STATUS_META: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  UPCOMING: { label: "예정",   dot: "#94a3b8", bg: "rgba(148,163,184,0.1)", text: "#94a3b8", border: "rgba(148,163,184,0.2)" },
  ONGOING:  { label: "진행중", dot: "#34d399", bg: "rgba(52,211,153,0.1)",  text: "#34d399", border: "rgba(52,211,153,0.25)" },
  FINISHED: { label: "종료",   dot: "#f87171", bg: "rgba(248,113,113,0.1)", text: "#f87171", border: "rgba(248,113,113,0.2)" },
};
const TYPE_LABELS: Record<string, string> = { KNOCKOUT: "토너먼트", LEAGUE: "리그전", GROUP: "조별·기수 리그" };
export const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: "축구", BASKETBALL: "농구", VOLLEYBALL: "배구",
  BASEBALL: "야구", FUTSAL: "풋살", BADMINTON: "배드민턴",
  TABLE_TENNIS: "탁구", TENNIS: "테니스", BILLIARDS: "당구", GOLF: "골프",
};
export const SPORT_EMOJI: Record<string, string> = {
  FOOTBALL: "⚽", BASKETBALL: "🏀", VOLLEYBALL: "🏐",
  BASEBALL: "⚾", FUTSAL: "⚽", BADMINTON: "🏸",
  TABLE_TENNIS: "🏓", TENNIS: "🎾", BILLIARDS: "🎱", GOLF: "⛳",
};

const CARD_STYLE = {
  background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
};

const labelCls = "block text-xs font-semibold mb-1.5 tracking-wide";
const labelStyle = { color: "rgba(255,255,255,0.4)" };
const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "white",
  borderRadius: "0.75rem",
  padding: "0.625rem 0.875rem",
  fontSize: "0.9rem",
  width: "100%",
  outline: "none",
  transition: "border 0.15s, box-shadow 0.15s",
};

function DarkInput({ value, onChange, placeholder, required, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      style={inputStyle}
      onFocus={e => {
        e.currentTarget.style.border = "1px solid rgba(23,111,193,0.7)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(23,111,193,0.15)";
      }}
      onBlur={e => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function DarkSelect({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: "pointer" }}
      onFocus={e => {
        e.currentTarget.style.border = "1px solid rgba(23,111,193,0.7)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(23,111,193,0.15)";
      }}
      onBlur={e => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {children}
    </select>
  );
}

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
      {/* 대회 추가 폼 */}
      <div className="lg:col-span-1">
        <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
          <div style={{ height: "3px", background: "linear-gradient(90deg, #176fc1, #2252ab, #176fc1)" }} />
          <div className="p-5">
            <h2 className="text-white font-extrabold text-base mb-5 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black text-white" style={{ background: "#176fc1" }}>+</span>
              새 대회 추가
            </h2>
            <form onSubmit={createTournament} className="space-y-3.5">
              <div>
                <label className={labelCls} style={labelStyle}>대회명 *</label>
                <DarkInput value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="예: 2026 봄 토너먼트" required />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>종목 *</label>
                <DarkSelect value={form.sport} onChange={v => setForm({ ...form, sport: v })}>
                  {Object.entries(SPORT_LABELS).map(([v, l]) => (
                    <option key={v} value={v} style={{ background: "#1e293b" }}>{SPORT_EMOJI[v]} {l}</option>
                  ))}
                </DarkSelect>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>대회 유형 *</label>
                <DarkSelect value={form.type} onChange={v => setForm({ ...form, type: v })}>
                  <option value="KNOCKOUT" style={{ background: "#1e293b" }}>토너먼트 (녹아웃)</option>
                  <option value="LEAGUE" style={{ background: "#1e293b" }}>리그전</option>
                  <option value="GROUP" style={{ background: "#1e293b" }}>조별·기수 리그</option>
                </DarkSelect>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls} style={labelStyle}>시작일</label>
                  <DarkInput type="date" value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>종료일</label>
                  <DarkInput type="date" value={form.endDate} onChange={v => setForm({ ...form, endDate: v })} />
                </div>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>설명</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="대회 설명 (선택)"
                  style={{ ...inputStyle, resize: "none" }}
                  onFocus={e => {
                    e.currentTarget.style.border = "1px solid rgba(23,111,193,0.7)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(23,111,193,0.15)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !form.name.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: loading || !form.name.trim() ? "rgba(23,111,193,0.4)" : "linear-gradient(135deg, #176fc1, #2252ab)",
                  boxShadow: loading || !form.name.trim() ? "none" : "0 4px 16px rgba(23,111,193,0.35)",
                  letterSpacing: "0.03em",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    추가 중...
                  </span>
                ) : "대회 추가"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 대회 목록 */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
          <div style={{ height: "3px", background: "linear-gradient(90deg, #176fc1, #2252ab, #176fc1)" }} />
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-extrabold text-base flex items-center gap-2">
                대회 목록
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(23,111,193,0.2)", color: "#60a5fa" }}>
                  {tournaments.length}
                </span>
              </h2>
            </div>

            {tournaments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🏆</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>등록된 대회가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tournaments.map((t) => {
                  const st = STATUS_META[t.status] || STATUS_META.UPCOMING;
                  return (
                    <div
                      key={t.id}
                      className="rounded-xl p-4 transition-all duration-150"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderLeft: `3px solid ${st.dot}`,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {/* 상태·종목·유형 배지 */}
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                              {st.label}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                              {SPORT_EMOJI[t.sport]} {SPORT_LABELS[t.sport] ?? t.sport}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(23,111,193,0.15)", color: "#93c5fd" }}>
                              {TYPE_LABELS[t.type]}
                            </span>
                          </div>
                          {/* 대회명 */}
                          <h3 className="font-bold text-sm text-white truncate mb-1">{t.name}</h3>
                          {/* 통계 */}
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                            팀 {t._count.teams}개 · 경기 {t._count.matches}개
                          </p>
                        </div>
                        {/* 버튼 */}
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Link
                            href={`/tournaments/${t.id}`}
                            target="_blank"
                            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
                            title="공개 페이지 보기"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            보기
                          </Link>
                          <button
                            onClick={() => setEditingId(t.id)}
                            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ background: "rgba(23,111,193,0.2)", color: "#93c5fd", border: "1px solid rgba(23,111,193,0.3)" }}
                          >
                            편집
                          </button>
                          <button
                            onClick={() => deleteTournament(t.id)}
                            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
