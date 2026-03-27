"use client";

import { useState, useEffect } from "react";
import MatchEditor from "./MatchEditor";

type Player = { id: string; name: string; number?: number | null; position?: string | null };
type Team = { id: string; name: string; shortName?: string | null; color?: string | null; players: Player[] };
type Goal = { id: string; type: string; teamId: string; minute?: number | null; player?: Player | null; team: Team };
type Group = { id: string; name: string; label?: string | null; teams: { id: string; team: Team; points: number }[] };
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
  stage?: string | null;
  status: string;
  goals: Goal[];
  group?: Group | null;
};
type TournamentTeam = { id: string; team: Team };
type Tournament = {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  teams: TournamentTeam[];
  matches: Match[];
  groups: Group[];
};

const STATUS_OPTIONS = [
  { value: "UPCOMING", label: "예정" },
  { value: "ONGOING", label: "진행중" },
  { value: "FINISHED", label: "종료" },
];

export default function TournamentEditor({ tournamentId, onBack }: { tournamentId: string; onBack: () => void }) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [tab, setTab] = useState<"info" | "teams" | "matches" | "groups">("matches");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [tRes, teamsRes] = await Promise.all([
      fetch(`/api/tournaments/${tournamentId}`),
      fetch("/api/teams"),
    ]);
    const t = await tRes.json();
    const teams = await teamsRes.json();
    setTournament(t);
    setAllTeams(teams);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tournamentId]);

  if (loading || !tournament) return <div className="text-center py-12 text-gray-400">불러오는 중...</div>;

  const participatingTeamIds = new Set(tournament.teams.map((tt) => tt.team.id));
  const availableTeams = allTeams.filter((t) => !participatingTeamIds.has(t.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="btn-secondary btn-sm">← 목록으로</button>
        <h2 className="font-bold text-xl">{tournament.name} 편집</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "matches", label: "경기 관리" },
          { key: "teams", label: "팀 구성" },
          { key: "groups", label: "조 편성", show: tournament.type === "GROUP" },
          { key: "info", label: "기본 정보" },
        ].filter((t) => t.show !== false).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === "info" && (
        <InfoTab tournament={tournament} onSave={async (data) => {
          setSaving(true);
          await fetch(`/api/tournaments/${tournamentId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
          setSaving(false);
          await load();
        }} saving={saving} />
      )}

      {/* Teams Tab */}
      {tab === "teams" && (
        <TeamsTab
          tournament={tournament}
          availableTeams={availableTeams}
          onAddTeams={async (teamIds) => {
            await Promise.all(teamIds.map((teamId) =>
              fetch(`/api/tournaments/${tournamentId}/teams`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId }),
              })
            ));
            await load();
          }}
          onRemoveTeam={async (teamId) => {
            await fetch(`/api/tournaments/${tournamentId}/teams`, {
              method: "DELETE", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ teamId }),
            });
            await load();
          }}
          onReload={load}
        />
      )}

      {/* Groups Tab */}
      {tab === "groups" && tournament.type === "GROUP" && (
        <GroupsTab
          tournament={tournament}
          onCreateGroup={async (name, label, teamIds) => {
            await fetch(`/api/tournaments/${tournamentId}/groups`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, label, teamIds }),
            });
            await load();
          }}
        />
      )}

      {/* Matches Tab */}
      {tab === "matches" && (
        editingMatch ? (
          <MatchEditor
            match={editingMatch}
            tournament={tournament}
            onBack={() => { setEditingMatch(null); load(); }}
          />
        ) : (
          <MatchesTab
            tournament={tournament}
            onCreateMatch={async (data) => {
              await fetch(`/api/tournaments/${tournamentId}/matches`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              await load();
            }}
            onEditMatch={setEditingMatch}
            onDeleteMatch={async (id) => {
              if (!confirm("경기를 삭제할까요?")) return;
              await fetch(`/api/matches/${id}`, { method: "DELETE" });
              await load();
            }}
          />
        )
      )}
    </div>
  );
}

function InfoTab({ tournament, onSave, saving }: { tournament: Tournament; onSave: (d: object) => void; saving: boolean }) {
  const [form, setForm] = useState({
    name: tournament.name,
    status: tournament.status,
    startDate: tournament.startDate ? tournament.startDate.slice(0, 10) : "",
    endDate: tournament.endDate ? tournament.endDate.slice(0, 10) : "",
    description: tournament.description || "",
  });
  return (
    <div className="card p-5 max-w-lg">
      <h3 className="font-bold mb-4">기본 정보 수정</h3>
      <div className="space-y-3">
        <div>
          <label className="label">대회명</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">상태</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
          <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button onClick={() => onSave(form)} className="btn-primary" disabled={saving}>{saving ? "저장 중..." : "저장"}</button>
      </div>
    </div>
  );
}

function TeamsTab({ tournament, availableTeams, onAddTeams, onRemoveTeam, onReload }: {
  tournament: Tournament;
  availableTeams: Team[];
  onAddTeams: (ids: string[]) => void;
  onRemoveTeam: (id: string) => void;
  onReload: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editForm, setEditForm] = useState({ name: "", shortName: "", color: "#3b82f6" });
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(selected.length === availableTeams.length ? [] : availableTeams.map((t) => t.id));

  const handleAdd = () => {
    if (selected.length === 0) return;
    onAddTeams(selected);
    setSelected([]);
  };

  const startEdit = (team: Team) => {
    setEditingTeam(team);
    setEditForm({ name: team.name, shortName: team.shortName || "", color: team.color || "#3b82f6" });
  };

  const saveEdit = async () => {
    if (!editingTeam) return;
    setSaving(true);
    await fetch(`/api/teams/${editingTeam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    setEditingTeam(null);
    onReload();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 참가 팀 */}
      <div className="card p-5">
        <h3 className="font-bold mb-3">참가 팀 ({tournament.teams.length})</h3>
        {tournament.teams.length === 0 ? (
          <p className="text-gray-400 text-sm">참가 팀 없음</p>
        ) : (
          <div className="space-y-1">
            {tournament.teams.map(({ team }) => (
              <div key={team.id}>
                {editingTeam?.id === team.id ? (
                  /* 인라인 편집 폼 */
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2 my-1">
                    <div className="flex gap-2">
                      <input
                        className="input flex-1 text-sm"
                        placeholder="팀 이름"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                      <input
                        className="input w-24 text-sm"
                        placeholder="약칭"
                        value={editForm.shortName}
                        onChange={(e) => setEditForm({ ...editForm, shortName: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        className="h-8 w-12 rounded border border-gray-300 cursor-pointer"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      />
                      <span className="text-xs text-gray-500 flex-1">팀 색상</span>
                      <button onClick={saveEdit} disabled={saving} className="btn-primary btn-sm text-xs">
                        {saving ? "저장중" : "저장"}
                      </button>
                      <button onClick={() => setEditingTeam(null)} className="btn-secondary btn-sm text-xs">취소</button>
                    </div>
                  </div>
                ) : (
                  /* 일반 행 */
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color || "#3b82f6" }} />
                      <span className="font-medium text-sm">{team.name}</span>
                      {team.shortName && <span className="text-xs text-gray-400">({team.shortName})</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(team)} className="text-blue-500 text-xs hover:text-blue-700">편집</button>
                      <button onClick={() => onRemoveTeam(team.id)} className="text-red-500 text-xs hover:text-red-700">제외</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 팀 추가 */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">팀 추가</h3>
          {availableTeams.length > 0 && (
            <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
              {selected.length === availableTeams.length ? "전체 해제" : "전체 선택"}
            </button>
          )}
        </div>

        {availableTeams.length === 0 ? (
          <p className="text-gray-400 text-sm">추가 가능한 팀이 없습니다</p>
        ) : (
          <>
            <div className="space-y-1 mb-4">
              {availableTeams.map((team) => {
                const checked = selected.includes(team.id);
                return (
                  <label
                    key={team.id}
                    className={`flex items-center gap-3 py-2 px-2 rounded-lg cursor-pointer transition-colors ${checked ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600"
                      checked={checked}
                      onChange={() => toggle(team.id)}
                    />
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color || "#3b82f6" }} />
                    <span className="text-sm font-medium">{team.name}</span>
                  </label>
                );
              })}
            </div>
            <button
              onClick={handleAdd}
              className="btn-primary w-full"
              disabled={selected.length === 0}
            >
              {selected.length > 0 ? `${selected.length}개 팀 추가` : "팀을 선택하세요"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function GroupsTab({ tournament, onCreateGroup }: {
  tournament: Tournament;
  onCreateGroup: (name: string, label: string, teamIds: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const assignedTeamIds = new Set(tournament.groups.flatMap((g) => g.teams.map((gt) => gt.team.id)));
  const unassigned = tournament.teams.filter((tt) => !assignedTeamIds.has(tt.team.id));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card p-5">
        <h3 className="font-bold mb-4">새 조 만들기</h3>
        <div className="space-y-3">
          <div>
            <label className="label">기수/조 ID (내부용)</label>
            <input className="input" placeholder="예: 20기, A조" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">표시 이름 (화면에 노출)</label>
            <input className="input" placeholder="예: 20기 리그, A조" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div>
            <label className="label">팀 선택 (미배정 팀)</label>
            {unassigned.length === 0 ? <p className="text-sm text-gray-400">배정 가능한 팀 없음</p> : (
              <div className="space-y-1 mt-2">
                {unassigned.map(({ team }) => (
                  <label key={team.id} className="flex items-center gap-2 cursor-pointer py-1">
                    <input type="checkbox" checked={selected.includes(team.id)} onChange={(e) => {
                      setSelected(e.target.checked ? [...selected, team.id] : selected.filter((id) => id !== team.id));
                    }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color || "#3b82f6" }} />
                    <span className="text-sm">{team.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { if (name && selected.length) { onCreateGroup(name, label, selected); setName(""); setLabel(""); setSelected([]); } }}
            className="btn-primary w-full"
            disabled={!name || selected.length === 0}
          >기수/조 생성</button>
        </div>
      </div>
      <div className="card p-5">
        <h3 className="font-bold mb-4">현재 조 편성</h3>
        {tournament.groups.length === 0 ? <p className="text-gray-400 text-sm">편성된 기수/조 없음</p> : (
          <div className="space-y-4">
            {tournament.groups.map((g) => (
              <div key={g.id}>
                <h4 className="font-semibold text-sm mb-2">{g.label || g.name}</h4>
                {g.teams.map((gt) => (
                  <div key={gt.id} className="flex items-center gap-2 py-1 text-sm">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gt.team.color || "#3b82f6" }} />
                    {gt.team.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchesTab({ tournament, onCreateMatch, onEditMatch, onDeleteMatch }: {
  tournament: Tournament;
  onCreateMatch: (d: object) => void;
  onEditMatch: (m: Match) => void;
  onDeleteMatch: (id: string) => void;
}) {
  const [form, setForm] = useState({
    homeTeamId: "", awayTeamId: "", date: "", venue: "", court: "", round: "", stage: "", groupId: "", matchOrder: "",
  });

  const STATUS_CLS: Record<string, string> = {
    SCHEDULED: "badge-gray",
    ONGOING: "badge-yellow",
    FINISHED: "badge-green",
  };
  const STATUS_LABEL: Record<string, string> = { SCHEDULED: "예정", ONGOING: "진행중", FINISHED: "종료" };

  return (
    <div className="space-y-4">
      {/* Create Match Form */}
      <div className="card p-5">
        <h3 className="font-bold mb-4">경기 추가</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-1">
            <label className="label">홈팀 *</label>
            <select className="input" value={form.homeTeamId} onChange={(e) => setForm({ ...form, homeTeamId: e.target.value })}>
              <option value="">선택</option>
              {tournament.teams.map(({ team }) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label">어웨이팀 *</label>
            <select className="input" value={form.awayTeamId} onChange={(e) => setForm({ ...form, awayTeamId: e.target.value })}>
              <option value="">선택</option>
              {tournament.teams.map(({ team }) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">라운드</label>
            <input className="input" placeholder="예: 8강, 1라운드" value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} />
          </div>
          <div>
            <label className="label">경기 순서</label>
            <input type="number" className="input" placeholder="순서" value={form.matchOrder} onChange={(e) => setForm({ ...form, matchOrder: e.target.value })} />
          </div>
          <div>
            <label className="label">일시</label>
            <input type="datetime-local" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">장소</label>
            <input className="input" placeholder="경기장" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          </div>
          <div>
            <label className="label">코트/구장</label>
            <input className="input" placeholder="예: A코트, 1구장" value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} />
          </div>
          {(tournament.type === "GROUP" || tournament.groups.length > 0) && (
            <div>
              <label className="label">기수/조</label>
              <select className="input" value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })}>
                <option value="">선택 안 함</option>
                {tournament.groups.map((g) => <option key={g.id} value={g.id}>{g.label || g.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <button
          onClick={() => { if (form.homeTeamId && form.awayTeamId) { onCreateMatch({ ...form, matchOrder: form.matchOrder ? parseInt(form.matchOrder) : null }); setForm({ homeTeamId: "", awayTeamId: "", date: "", venue: "", court: "", round: "", stage: "", groupId: "", matchOrder: "" }); } }}
          className="btn-primary mt-3"
          disabled={!form.homeTeamId || !form.awayTeamId}
        >경기 추가</button>
      </div>

      {/* Matches List */}
      <div className="card p-5">
        <h3 className="font-bold mb-4">경기 목록 ({tournament.matches.length})</h3>
        {tournament.matches.length === 0 ? (
          <p className="text-gray-400 text-center py-6">등록된 경기가 없습니다</p>
        ) : (
          <div className="space-y-2">
            {tournament.matches.map((match) => (
              <div key={match.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className={STATUS_CLS[match.status] || "badge-gray"}>{STATUS_LABEL[match.status] || match.status}</span>
                    <span className="font-medium text-sm">
                      {match.homeTeam.name}
                      <span className="mx-2 font-bold">
                        {match.status === "FINISHED" ? `${match.homeScore} - ${match.awayScore}` : "vs"}
                      </span>
                      {match.awayTeam.name}
                    </span>
                    {match.round && <span className="text-xs text-gray-400">{match.round}</span>}
                    {match.group && <span className="text-xs text-blue-400">{match.group.label || match.group.name}</span>}
                    {match.court && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 rounded">{match.court}</span>}
                  </div>
                  {match.date && <p className="text-xs text-gray-400 mt-1">{new Date(match.date).toLocaleString("ko-KR")}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onEditMatch(match)} className="btn-primary btn-sm text-xs">결과 입력</button>
                  <button onClick={() => onDeleteMatch(match.id)} className="btn-danger btn-sm text-xs">삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
