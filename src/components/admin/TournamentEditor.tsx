"use client";

import { useState, useEffect } from "react";
import MatchEditor from "./MatchEditor";
import PlayerManager from "./PlayerManager";

type Player = { id: string; name: string; number?: number | null; position?: string | null };
type Team = { id: string; name: string; shortName?: string | null; color?: string | null; players: Player[] };
type Goal = { id: string; type: string; teamId: string; minute?: number | null; player?: Player | null; team: Team };
type Group = { id: string; name: string; label?: string | null; color?: string | null; teams: { id: string; team: Team; points: number }[] };
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
  matchOrder?: number | null;
  status: string;
  goals: Goal[];
  group?: { id: string; name: string; label?: string | null; color?: string | null } | null;
  referee?: string | null;
  assistantReferee1?: string | null;
  assistantReferee2?: string | null;
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
  rules?: string | null;
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
  const [tab, setTab] = useState<"info" | "teams" | "matches" | "groups" | "rules">("matches");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [tRes, teamsRes] = await Promise.all([
      fetch(`/api/tournaments/${tournamentId}`, { cache: "no-store" }),
      fetch("/api/teams", { cache: "no-store" }),
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
      <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: "matches", label: "경기 관리" },
            { key: "teams", label: "팀 구성" },
            { key: "groups", label: "조 편성", show: tournament.type === "GROUP" },
            { key: "rules", label: "운영규칙" },
            { key: "info", label: "기본 정보" },
          ].filter((t) => t.show !== false).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
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

      {/* Rules Tab */}
      {tab === "rules" && (
        <RulesTab tournament={tournament} onSave={async (data) => {
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
          onCreateGroup={async (name, label, color, teamIds) => {
            await fetch(`/api/tournaments/${tournamentId}/groups`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, label, color, teamIds }),
            });
            await load();
          }}
        onReload={load}
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

function RulesTab({ tournament, onSave, saving }: { tournament: Tournament; onSave: (d: object) => void; saving: boolean }) {
  const [rules, setRules] = useState(tournament.rules || "");
  return (
    <div className="card p-5">
      <h3 className="font-bold mb-1">운영규칙 편집</h3>
      <p className="text-xs text-gray-400 mb-4">줄바꿈이 그대로 표시됩니다. 내용이 있으면 공개 페이지에 "운영규칙" 탭이 나타납니다.</p>
      <textarea
        className="input font-mono text-sm w-full"
        rows={18}
        placeholder={"예)\n1. 경기 방식\n  - 전·후반 각 25분\n\n2. 선수 등록\n  - 경기 전날까지 명단 제출\n\n3. 실격 규정\n  ..."}
        value={rules}
        onChange={(e) => setRules(e.target.value)}
      />
      <div className="flex items-center gap-3 mt-3">
        <button onClick={() => onSave({ rules })} className="btn-primary" disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </button>
        {rules && (
          <button onClick={() => { if (confirm("운영규칙을 초기화할까요?")) { setRules(""); onSave({ rules: "" }); } }} className="btn-danger btn-sm text-xs">
            초기화
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{rules.length}자</span>
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
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newTeamForm, setNewTeamForm] = useState({ name: "", shortName: "", color: "#3b82f6" });
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);

  const createTeam = async () => {
    if (!newTeamForm.name) return;
    setCreatingTeam(true);
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTeamForm),
    });
    if (res.ok) {
      setNewTeamForm({ name: "", shortName: "", color: "#3b82f6" });
      setShowNewTeamForm(false);
      onReload();
    }
    setCreatingTeam(false);
  };

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

  const selectedTeam = tournament.teams.find((tt) => tt.team.id === selectedTeamId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 참가 팀 */}
      <div className="card p-5">
        <h3 className="font-bold mb-3">참가 팀 ({tournament.teams.length})</h3>
        {tournament.teams.length === 0 ? (
          <p className="text-gray-400 text-sm">참가 팀 없음</p>
        ) : (
          <div className="space-y-1">
            {[...tournament.teams].sort((a, b) => a.team.name.localeCompare(b.team.name, "ko", { numeric: true })).map(({ team }) => (
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
                  <div className={`flex items-center justify-between py-1.5 border-b border-gray-100 cursor-pointer rounded px-1 ${selectedTeamId === team.id ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    onClick={() => setSelectedTeamId(selectedTeamId === team.id ? null : team.id)}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color || "#3b82f6" }} />
                      <span className="font-medium text-sm">{team.name}</span>
                      {team.shortName && <span className="text-xs text-gray-400">({team.shortName})</span>}
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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

        {/* 새 팀 만들기 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          {showNewTeamForm ? (
            <div className="space-y-2">
              <input className="input text-sm" placeholder="팀 이름 *" value={newTeamForm.name} onChange={(e) => setNewTeamForm({ ...newTeamForm, name: e.target.value })} />
              <input className="input text-sm" placeholder="약칭" value={newTeamForm.shortName} onChange={(e) => setNewTeamForm({ ...newTeamForm, shortName: e.target.value })} />
              <div className="flex items-center gap-2">
                <input type="color" className="h-8 w-12 rounded border border-gray-300 cursor-pointer" value={newTeamForm.color} onChange={(e) => setNewTeamForm({ ...newTeamForm, color: e.target.value })} />
                <span className="text-xs text-gray-500 flex-1">팀 색상</span>
                <button onClick={createTeam} disabled={!newTeamForm.name || creatingTeam} className="btn-primary btn-sm text-xs">{creatingTeam ? "추가중" : "추가"}</button>
                <button onClick={() => setShowNewTeamForm(false)} className="btn-secondary btn-sm text-xs">취소</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewTeamForm(true)} className="text-sm text-blue-600 hover:underline">+ 새 팀 만들기</button>
          )}
        </div>
      </div>
    </div>

      {/* 선수 관리 */}
      {selectedTeam && (
        <div className="card p-5">
          <h3 className="font-bold mb-3">{selectedTeam.team.name} 선수 관리</h3>
          <PlayerManager teamId={selectedTeam.team.id} teamName={selectedTeam.team.name} />
        </div>
      )}
    </div>
  );
}

function GroupsTab({ tournament, onCreateGroup, onReload }: {
  tournament: Tournament;
  onCreateGroup: (name: string, label: string, color: string, teamIds: string[]) => void;
  onReload: () => void;
}) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [selected, setSelected] = useState<string[]>([]);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editForm, setEditForm] = useState({ name: "", label: "", color: "#6366f1" });
  const [saving, setSaving] = useState(false);

  const assignedTeamIds = new Set(tournament.groups.flatMap((g) => g.teams.map((gt) => gt.team.id)));
  const unassigned = tournament.teams.filter((tt) => !assignedTeamIds.has(tt.team.id));

  const startEdit = (g: Group) => {
    setEditingGroup(g);
    setEditForm({ name: g.name, label: g.label || "", color: g.color || "#6366f1" });
  };

  const saveEdit = async () => {
    if (!editingGroup) return;
    setSaving(true);
    await fetch(`/api/tournaments/${tournament.id}/groups/${editingGroup.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    setEditingGroup(null);
    onReload();
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm("조를 삭제할까요? 해당 조의 경기 배정도 해제됩니다.")) return;
    await fetch(`/api/tournaments/${tournament.id}/groups/${groupId}`, { method: "DELETE" });
    onReload();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 새 조 만들기 */}
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
            <label className="label">조 색상</label>
            <div className="flex items-center gap-3">
              <input type="color" className="h-9 w-16 rounded border border-gray-300 cursor-pointer" value={color} onChange={(e) => setColor(e.target.value)} />
              <span className="text-sm font-medium px-3 py-1 rounded-full text-gray-700" style={{ backgroundColor: color + "33" }}>{label || name || "미리보기"}</span>
            </div>
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
            onClick={() => { if (name && selected.length) { onCreateGroup(name, label, color, selected); setName(""); setLabel(""); setColor("#6366f1"); setSelected([]); } }}
            className="btn-primary w-full"
            disabled={!name || selected.length === 0}
          >기수/조 생성</button>
        </div>
      </div>

      {/* 현재 조 편성 */}
      <div className="card p-5">
        <h3 className="font-bold mb-4">현재 조 편성</h3>
        {tournament.groups.length === 0 ? <p className="text-gray-400 text-sm">편성된 기수/조 없음</p> : (
          <div className="space-y-3">
            {tournament.groups.map((g) => (
              <div key={g.id} className="border border-gray-100 rounded-xl p-3">
                {editingGroup?.id === g.id ? (
                  /* 인라인 편집 폼 */
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input className="input flex-1 text-sm" placeholder="기수/조 ID" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                      <input className="input flex-1 text-sm" placeholder="표시 이름" value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="color" className="h-8 w-12 rounded border border-gray-300 cursor-pointer" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} />
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-1 text-gray-700" style={{ backgroundColor: editForm.color + "33" }}>{editForm.label || editForm.name || "미리보기"}</span>
                      <button onClick={saveEdit} disabled={saving} className="btn-primary btn-sm text-xs">{saving ? "저장중" : "저장"}</button>
                      <button onClick={() => setEditingGroup(null)} className="btn-secondary btn-sm text-xs">취소</button>
                    </div>
                  </div>
                ) : (
                  /* 일반 표시 */
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color || "#6366f1" }} />
                        <span>{g.label || g.name}</span>
                      </h4>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(g)} className="text-blue-500 text-xs hover:text-blue-700">편집</button>
                        <button onClick={() => deleteGroup(g.id)} className="text-red-500 text-xs hover:text-red-700">삭제</button>
                      </div>
                    </div>
                    {g.teams.map((gt) => (
                      <div key={gt.id} className="flex items-center gap-2 py-1 text-sm">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gt.team.color || "#3b82f6" }} />
                        {gt.team.name}
                      </div>
                    ))}
                  </div>
                )}
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

  const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
    SCHEDULED: { label: "예정", cls: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
    ONGOING:   { label: "진행중", cls: "bg-amber-100 text-amber-600", dot: "bg-amber-400" },
    FINISHED:  { label: "종료", cls: "bg-green-100 text-green-600", dot: "bg-green-500" },
  };

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
              {[...tournament.teams].sort((a, b) => a.team.name.localeCompare(b.team.name, "ko", { numeric: true })).map(({ team }) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label">어웨이팀 *</label>
            <select className="input" value={form.awayTeamId} onChange={(e) => setForm({ ...form, awayTeamId: e.target.value })}>
              <option value="">선택</option>
              {[...tournament.teams].sort((a, b) => a.team.name.localeCompare(b.team.name, "ko", { numeric: true })).map(({ team }) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{tournament.type === "LEAGUE" ? "주차" : "라운드"}</label>
            <input className="input" placeholder={tournament.type === "LEAGUE" ? "예: 1주차, 2주차" : "예: 8강, 1라운드"} value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} />
          </div>
          <div>
            <label className="label">경기 순서</label>
            <input type="number" className="input" placeholder="순서" value={form.matchOrder} onChange={(e) => setForm({ ...form, matchOrder: e.target.value })} />
          </div>
          <div>
            <label className="label">일시</label>
            <input type="datetime-local" step="600" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
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
        <h3 className="font-bold mb-4">경기 일정 ({tournament.matches.length})</h3>
        {tournament.matches.length === 0 ? (
          <p className="text-gray-400 text-center py-6">등록된 경기가 없습니다</p>
        ) : (() => {
          // Group matches by date (YYYY-MM-DD), undated matches go to "__none__"
          const grouped = new Map<string, typeof tournament.matches>();
          const sorted = [...tournament.matches].sort((a, b) => {
            const da = a.date ? a.date.slice(0, 10) : "9999-99-99";
            const db = b.date ? b.date.slice(0, 10) : "9999-99-99";
            if (da !== db) return da.localeCompare(db);
            return (a.matchOrder ?? 999) - (b.matchOrder ?? 999);
          });
          for (const m of sorted) {
            const key = m.date ? m.date.slice(0, 10) : "__none__";
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(m);
          }
          return (
            <div className="space-y-5">
              {[...grouped.entries()].map(([dateKey, matches]) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {dateKey === "__none__" ? "날짜 미지정" : new Date(dateKey + "T00:00:00").toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
                    </span>
                    <span className="text-xs text-gray-400">({matches.length}경기)</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="space-y-2">
                    {matches.map((match, idx) => {
                      const cfg = STATUS_CFG[match.status] ?? { label: match.status, cls: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };
                      const referees = [match.referee, match.assistantReferee1, match.assistantReferee2].filter(Boolean);
                      return (
                        <div key={match.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            {/* Top row: order + status + teams + score */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Match order number */}
                              <span className="text-xs font-bold text-gray-400 w-5 text-center flex-shrink-0">
                                {match.matchOrder ?? idx + 1}
                              </span>
                              {/* Status badge */}
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </span>
                              {/* Teams */}
                              <div className="flex items-center gap-1.5 font-medium text-sm">
                                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: match.homeTeam.color || "#3b82f6" }} />
                                <span>{match.homeTeam.name}</span>
                                <span className="mx-1.5 font-bold text-gray-400">
                                  {match.status === "FINISHED" ? (
                                    <span className="text-gray-800">{match.homeScore} - {match.awayScore}</span>
                                  ) : "vs"}
                                </span>
                                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: match.awayTeam.color || "#ef4444" }} />
                                <span>{match.awayTeam.name}</span>
                              </div>
                              {/* Meta tags */}
                              {match.round && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{match.round}</span>}
                              {match.group && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium text-gray-700" style={{ backgroundColor: (match.group.color || "#6366f1") + "33" }}>
                                  {match.group.label || match.group.name}
                                </span>
                              )}
                              {match.court && <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">{match.court}</span>}
                            </div>
                            {/* Bottom row: time + referees */}
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {match.date && (
                                <span className="text-xs text-gray-400" suppressHydrationWarning>
                                  {new Date(match.date).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                              {referees.length > 0 && (
                                <span className="text-xs text-gray-500">
                                  심판 {match.referee && `주심 ${match.referee}`}{(match.assistantReferee1 || match.assistantReferee2) && ` / 부심 ${[match.assistantReferee1, match.assistantReferee2].filter(Boolean).join(", ")}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-3 flex-shrink-0">
                            <button onClick={() => onEditMatch(match)} className="btn-primary btn-sm text-xs">편집</button>
                            <button onClick={() => onDeleteMatch(match.id)} className="btn-danger btn-sm text-xs">삭제</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
