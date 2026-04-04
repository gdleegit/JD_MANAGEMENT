"use client";

import { useState } from "react";
import SaveButton from "./SaveButton";

type Player = { id: string; name: string; number?: number | null };
type Team = { id: string; name: string; color?: string | null; players?: Player[] };
type Goal = { id: string; type: string; teamId: string; minute?: number | null; half?: number | null; player?: Player | null; team: Team };
type PendingGoal = { tempId: string; teamId: string; playerId: string; minute: string; half: string; type: string };
type Match = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  date?: string | null;
  venue?: string | null;
  court?: string | null;
  round?: string | null;
  matchOrder?: number | null;
  status: string;
  goals: Goal[];
  referee?: string | null;
  assistantReferee1?: string | null;
  assistantReferee2?: string | null;
  videoUrl?: string | null;
};
type Tournament = { id: string; name: string; type: string };

const GOAL_TYPES = [
  { value: "GOAL",      label: "일반골" },
  { value: "PENALTY",   label: "PK" },
  { value: "OWN_GOAL",  label: "자책골" },
];

const STATUS_OPTS = [
  { value: "SCHEDULED", label: "예정",   cls: "bg-gray-100 text-gray-600 border-gray-200" },
  { value: "ONGOING",   label: "진행중", cls: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "FINISHED",  label: "종료",   cls: "bg-green-100 text-green-700 border-green-300" },
];

export default function MatchEditor({ match, tournament, onBack }: { match: Match; tournament: Tournament; onBack: () => void }) {
  const [currentMatch, setCurrentMatch] = useState(match);
  const [status, setStatus]             = useState(match.status);
  const [homeScore, setHomeScore]       = useState(match.homeScore?.toString() ?? "");
  const [awayScore, setAwayScore]       = useState(match.awayScore?.toString() ?? "");
  const [date, setDate] = useState(() => {
    if (!match.date) return "";
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Seoul",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(match.date)).replace(" ", "T");
  });
  const [venue,             setVenue]             = useState(match.venue ?? "");
  const [court,             setCourt]             = useState(match.court ?? "");
  const [round,             setRound]             = useState(match.round ?? "");
  const [matchOrder,        setMatchOrder]        = useState(match.matchOrder?.toString() ?? "");
  const [referee,           setReferee]           = useState(match.referee ?? "");
  const [assistantReferee1, setAssistantReferee1] = useState(match.assistantReferee1 ?? "");
  const [assistantReferee2, setAssistantReferee2] = useState(match.assistantReferee2 ?? "");
  const [videoUrl, setVideoUrl] = useState(match.videoUrl ?? "");
  const [goalForm, setGoalForm] = useState({ teamId: match.homeTeam.id, playerId: "", minute: "", half: "1", type: "GOAL" });
  const [pendingGoals, setPendingGoals] = useState<PendingGoal[]>([]);

  // 로컬에만 추가 (API 호출 없음)
  const stagePendingGoal = () => {
    setPendingGoals(prev => [...prev, { ...goalForm, tempId: `${Date.now()}-${Math.random()}` }]);
    setGoalForm(f => ({ ...f, playerId: "", minute: "" }));
  };

  const removePendingGoal = (tempId: string) => {
    setPendingGoals(prev => prev.filter(g => g.tempId !== tempId));
  };

  // 통합 저장: match PATCH + bulk goals 병렬
  const saveAll = async () => {
    const parsedHome = homeScore !== "" ? parseInt(homeScore) : null;
    const parsedAway = awayScore !== "" ? parseInt(awayScore) : null;
    const effectiveStatus =
      (parsedHome !== null && parsedAway !== null && status !== "SCHEDULED")
        ? "FINISHED"
        : status;
    if (effectiveStatus !== status) setStatus(effectiveStatus);

    // pending goals가 있으면 스코어는 bulk goals가 재계산 — PATCH에 포함하면 race condition 발생
    const matchPatchBody: Record<string, unknown> = {
      status: effectiveStatus,
      date: date ? new Date(date).toISOString() : null,
      venue: venue || null,
      court: court || null,
      round: round || null,
      matchOrder: matchOrder !== "" ? parseInt(matchOrder) : null,
      referee: referee || null,
      assistantReferee1: assistantReferee1 || null,
      assistantReferee2: assistantReferee2 || null,
      videoUrl: videoUrl || null,
    };
    if (pendingGoals.length === 0) {
      matchPatchBody.homeScore = parsedHome;
      matchPatchBody.awayScore = parsedAway;
    }

    const matchFetch = fetch(`/api/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(matchPatchBody),
    });

    if (pendingGoals.length > 0) {
      const goalsFetch = fetch(`/api/matches/${match.id}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals: pendingGoals.map(g => ({
            teamId: g.teamId,
            playerId: g.playerId || null,
            minute: g.minute ? parseInt(g.minute) : null,
            half: parseInt(g.half),
            type: g.type,
          })),
        }),
      });

      const [, goalsRes] = await Promise.all([matchFetch, goalsFetch]);
      const { goals, homeScore: hs, awayScore: as_ } = await goalsRes.json();
      setCurrentMatch(m => ({ ...m, status: effectiveStatus, goals, homeScore: hs, awayScore: as_ }));
      setHomeScore(hs?.toString() ?? "");
      setAwayScore(as_?.toString() ?? "");
      setPendingGoals([]);
    } else {
      await matchFetch;
      setCurrentMatch(m => ({ ...m, status: effectiveStatus, homeScore: parsedHome, awayScore: parsedAway }));
    }
  };

  const deleteGoal = async (goalId: string) => {
    const res = await fetch(`/api/matches/${match.id}/goals`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId }),
    });
    const { homeScore: hs, awayScore: as_ } = await res.json();
    setCurrentMatch(m => ({ ...m, goals: m.goals.filter(g => g.id !== goalId), homeScore: hs, awayScore: as_ }));
    setHomeScore(hs?.toString() ?? "");
    setAwayScore(as_?.toString() ?? "");
  };

  const selectedTeam = goalForm.teamId === match.homeTeam.id ? match.homeTeam : match.awayTeam;
  const homeGoals = currentMatch.goals.filter((g) => g.teamId === match.homeTeam.id).sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));
  const awayGoals = currentMatch.goals.filter((g) => g.teamId === match.awayTeam.id).sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));
  const homePending = pendingGoals.filter(g => g.teamId === match.homeTeam.id);
  const awayPending = pendingGoals.filter(g => g.teamId === match.awayTeam.id);

  const getPendingPlayerName = (g: PendingGoal) => {
    const team = g.teamId === match.homeTeam.id ? match.homeTeam : match.awayTeam;
    const player = team.players?.find(p => p.id === g.playerId);
    return player ? (player.number ? `${player.number}. ${player.name}` : player.name) : "미상";
  };

  const totalGoals = currentMatch.goals.length + pendingGoals.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="btn btn-secondary btn-sm">← 경기 목록</button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: match.homeTeam.color || "#3b82f6" }} />
          <span className="font-bold truncate">{match.homeTeam.name}</span>
          {currentMatch.homeScore !== null && currentMatch.homeScore !== undefined ? (
            <span className="font-bold text-base text-gray-800 mx-1 flex-shrink-0">
              {currentMatch.homeScore} - {currentMatch.awayScore}
            </span>
          ) : (
            <span className="text-gray-400 text-sm mx-1 flex-shrink-0">vs</span>
          )}
          <span className="font-bold truncate">{match.awayTeam.name}</span>
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: match.awayTeam.color || "#ef4444" }} />
        </div>
        {match.round && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">{match.round}</span>}
        {match.court && <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full flex-shrink-0">{match.court}</span>}
      </div>

      {/* ── 스코어보드 ── */}
      <div className="card p-5">
        {/* 상태 토글 */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {STATUS_OPTS.map((o) => (
            <button
              key={o.value}
              onClick={() => setStatus(o.value)}
              className={`py-2 rounded-full text-xs font-semibold border transition-all text-center ${
                status === o.value ? o.cls + " ring-2 ring-offset-1 ring-current" : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* 스코어 입력 */}
        <div className="flex items-center gap-4">
          <div className="flex-1 text-right">
            <div className="flex items-center justify-end gap-2 mb-2">
              <span className="font-semibold text-sm sm:text-base">{match.homeTeam.name}</span>
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: match.homeTeam.color || "#3b82f6" }} />
            </div>
            <input
              type="number" min="0"
              className="input text-center text-3xl font-bold h-16 w-full"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
            />
          </div>

          <div className="text-3xl font-bold text-gray-200 pt-8 flex-shrink-0">:</div>

          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: match.awayTeam.color || "#ef4444" }} />
              <span className="font-semibold text-sm sm:text-base">{match.awayTeam.name}</span>
            </div>
            <input
              type="number" min="0"
              className="input text-center text-3xl font-bold h-16 w-full"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── 득점 기록 추가 ── */}
      <div className="card p-5">
        <h4 className="font-bold mb-4">득점 기록 추가</h4>

        {/* 팀 선택 pill */}
        <div className="flex gap-2 mb-3">
          {[match.homeTeam, match.awayTeam].map((t) => (
            <button
              key={t.id}
              onClick={() => setGoalForm({ ...goalForm, teamId: t.id, playerId: "" })}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex-1 justify-center ${
                goalForm.teamId === t.id
                  ? "text-white border-transparent shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
              style={goalForm.teamId === t.id ? { backgroundColor: t.color || "#3b82f6", borderColor: t.color || "#3b82f6" } : {}}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: goalForm.teamId === t.id ? "white" : (t.color || "#3b82f6"), opacity: goalForm.teamId === t.id ? 0.7 : 1 }} />
              {t.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 선수 */}
          <div className="col-span-2 sm:col-span-1">
            <label className="label">선수</label>
            <select className="input" value={goalForm.playerId} onChange={(e) => setGoalForm({ ...goalForm, playerId: e.target.value })}>
              <option value="">미상</option>
              {[...(selectedTeam.players ?? [])]
                .sort((a, b) => {
                  if (a.number && b.number) return a.number - b.number;
                  if (a.number) return -1;
                  if (b.number) return 1;
                  return a.name.localeCompare(b.name, "ko");
                })
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.number ? `${p.number}. ` : ""}{p.name}</option>
                ))}
            </select>
          </div>

          {/* 전반/후반 */}
          <div>
            <label className="label">전/후반</label>
            <div className="flex gap-1.5">
              {[{ value: "1", label: "전반" }, { value: "2", label: "후반" }].map((h) => (
                <button
                  key={h.value}
                  onClick={() => setGoalForm({ ...goalForm, half: h.value })}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    goalForm.half === h.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* 분 */}
          <div>
            <label className="label">분</label>
            <input
              type="number" min="1" max="120"
              className="input"
              placeholder="예: 45"
              value={goalForm.minute}
              onChange={(e) => setGoalForm({ ...goalForm, minute: e.target.value })}
            />
          </div>

          {/* 유형 */}
          <div>
            <label className="label">유형</label>
            <div className="flex gap-1.5">
              {GOAL_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setGoalForm({ ...goalForm, type: t.value })}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    goalForm.type === t.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={stagePendingGoal} className="btn btn-secondary w-full mt-3">
          + 목록에 추가
        </button>
      </div>

      {/* ── 득점 기록 목록 ── */}
      {totalGoals > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold">
              득점 기록 ({currentMatch.goals.length}골
              {pendingGoals.length > 0 && <span className="text-amber-600"> + {pendingGoals.length} 미저장</span>})
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* 홈 */}
            <div>
              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: match.homeTeam.color || "#3b82f6" }} />
                <span className="text-xs font-semibold text-gray-600">{match.homeTeam.name}</span>
                <span className="ml-auto text-xs font-bold text-blue-600">{homeGoals.length + homePending.length}골</span>
              </div>
              <div className="space-y-1.5">
                {homeGoals.length === 0 && homePending.length === 0
                  ? <p className="text-xs text-gray-300 text-center py-2">-</p>
                  : <>
                    {homeGoals.map((g) => (
                      <div key={g.id} className="flex items-center gap-1.5">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">{g.player?.name || "미상"}</span>
                          {g.half && <span className="text-xs text-blue-500 ml-1">{g.half === 1 ? "전반" : "후반"}</span>}
                          {g.minute && <span className="text-xs text-gray-400 ml-1">{g.minute}&apos;</span>}
                          {g.type !== "GOAL" && (
                            <span className="text-xs text-amber-600 ml-1">({g.type === "OWN_GOAL" ? "자책" : "PK"})</span>
                          )}
                        </div>
                        <button onClick={() => deleteGoal(g.id)} className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0 text-xs">✕</button>
                      </div>
                    ))}
                    {homePending.map((g) => (
                      <div key={g.tempId} className="flex items-center gap-1.5 bg-amber-50 rounded px-1.5 py-0.5">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate text-amber-800">{getPendingPlayerName(g)}</span>
                          <span className="text-xs text-amber-500 ml-1">{g.half === "1" ? "전반" : "후반"}</span>
                          {g.minute && <span className="text-xs text-amber-400 ml-1">{g.minute}&apos;</span>}
                          {g.type !== "GOAL" && (
                            <span className="text-xs text-amber-600 ml-1">({g.type === "OWN_GOAL" ? "자책" : "PK"})</span>
                          )}
                        </div>
                        <button onClick={() => removePendingGoal(g.tempId)} className="w-6 h-6 flex items-center justify-center rounded text-amber-400 hover:bg-amber-100 hover:text-amber-600 transition-colors flex-shrink-0 text-xs">✕</button>
                      </div>
                    ))}
                  </>}
              </div>
            </div>

            {/* 어웨이 */}
            <div>
              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: match.awayTeam.color || "#ef4444" }} />
                <span className="text-xs font-semibold text-gray-600">{match.awayTeam.name}</span>
                <span className="ml-auto text-xs font-bold text-blue-600">{awayGoals.length + awayPending.length}골</span>
              </div>
              <div className="space-y-1.5">
                {awayGoals.length === 0 && awayPending.length === 0
                  ? <p className="text-xs text-gray-300 text-center py-2">-</p>
                  : <>
                    {awayGoals.map((g) => (
                      <div key={g.id} className="flex items-center gap-1.5">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">{g.player?.name || "미상"}</span>
                          {g.half && <span className="text-xs text-blue-500 ml-1">{g.half === 1 ? "전반" : "후반"}</span>}
                          {g.minute && <span className="text-xs text-gray-400 ml-1">{g.minute}&apos;</span>}
                          {g.type !== "GOAL" && (
                            <span className="text-xs text-amber-600 ml-1">({g.type === "OWN_GOAL" ? "자책" : "PK"})</span>
                          )}
                        </div>
                        <button onClick={() => deleteGoal(g.id)} className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0 text-xs">✕</button>
                      </div>
                    ))}
                    {awayPending.map((g) => (
                      <div key={g.tempId} className="flex items-center gap-1.5 bg-amber-50 rounded px-1.5 py-0.5">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate text-amber-800">{getPendingPlayerName(g)}</span>
                          <span className="text-xs text-amber-500 ml-1">{g.half === "1" ? "전반" : "후반"}</span>
                          {g.minute && <span className="text-xs text-amber-400 ml-1">{g.minute}&apos;</span>}
                          {g.type !== "GOAL" && (
                            <span className="text-xs text-amber-600 ml-1">({g.type === "OWN_GOAL" ? "자책" : "PK"})</span>
                          )}
                        </div>
                        <button onClick={() => removePendingGoal(g.tempId)} className="w-6 h-6 flex items-center justify-center rounded text-amber-400 hover:bg-amber-100 hover:text-amber-600 transition-colors flex-shrink-0 text-xs">✕</button>
                      </div>
                    ))}
                  </>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 경기 상세 정보 ── */}
      <div className="card p-5">
        <h4 className="font-bold mb-4">경기 상세 정보</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="label">일시</label>
            <input type="datetime-local" step="600" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">장소</label>
            <input type="text" className="input" placeholder="경기장" value={venue} onChange={(e) => setVenue(e.target.value)} />
          </div>
          <div>
            <label className="label">코트/구장</label>
            <input type="text" className="input" placeholder="예: A코트, 1구장" value={court} onChange={(e) => setCourt(e.target.value)} />
          </div>
          <div>
            <label className="label">{tournament.type === "LEAGUE" ? "주차" : "라운드"}</label>
            <input type="text" className="input" placeholder={tournament.type === "LEAGUE" ? "예: 1주차" : "예: 8강"} value={round} onChange={(e) => setRound(e.target.value)} />
          </div>
          <div>
            <label className="label">경기 순서</label>
            <input type="number" className="input" placeholder="순서" value={matchOrder} onChange={(e) => setMatchOrder(e.target.value)} />
          </div>
        </div>

        {/* 심판진 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">심판진</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">주심</label>
              <input type="text" className="input" placeholder="주심 이름" value={referee} onChange={(e) => setReferee(e.target.value)} />
            </div>
            <div>
              <label className="label">부심 1</label>
              <input type="text" className="input" placeholder="부심 이름" value={assistantReferee1} onChange={(e) => setAssistantReferee1(e.target.value)} />
            </div>
            <div>
              <label className="label">부심 2</label>
              <input type="text" className="input" placeholder="부심 이름" value={assistantReferee2} onChange={(e) => setAssistantReferee2(e.target.value)} />
            </div>
          </div>
        </div>

        {/* 경기 영상 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">경기 영상</p>
          <div>
            <label className="label">영상 URL (YouTube 등)</label>
            <input
              type="url"
              className="input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── 통합 저장 버튼 ── */}
      <SaveButton
        onClick={saveAll}
        label={pendingGoals.length > 0 ? `저장 (득점 ${pendingGoals.length}개 포함)` : "저장"}
        className="w-full"
      />
    </div>
  );
}
