# Data Flow & State Patterns

## 공개 뷰 데이터 흐름
```
tournaments/page.tsx (서버, revalidate=300)
  → DB: tournament 목록
  → 정렬: ONGOING 우선, 나머지 startDate DESC (null 마지막) / createdAt DESC

[id]/page.tsx (서버, revalidate=60)
  → DB: tournament (teams+matches+goals+groups+sponsors, players 없음)
  → TournamentPublicView (클라이언트)
      → useEffect: /api/tournaments/[id]/teams 로 players lazy load
```

## 관리자 데이터 흐름
```
admin/page.tsx (서버, force-dynamic)
  → 인증만 확인, DB fetch 없음
  → AdminDashboard (클라이언트)
      → useEffect: /api/tournaments fetch
      → TournamentEditor
          → 초기: /api/tournaments/[id] + /api/teams 병렬 fetch
          → 경기 편집 클릭: /api/matches/[id] fetch (players 포함)
          → 이후 변경: 로컬 state 업데이트만 (DB 재조회 없음)
```

## 대회 목록 정렬
```ts
const sorted = [...raw].sort((a, b) => {
  const sa = calcStatus(a) === "ONGOING" ? 0 : 1;
  const sb = calcStatus(b) === "ONGOING" ? 0 : 1;
  return sa - sb; // ONGOING 먼저, 나머지는 DB 순서 유지
});
```

## 로컬 State 업데이트 패턴

```ts
// 경기 추가
setTournament(t => t ? { ...t, matches: [...t.matches, { ...newMatch, goals: [] }] } : t);
// 경기 삭제
setTournament(t => t ? { ...t, matches: t.matches.filter(m => m.id !== id) } : t);
// 팀 추가
setTournament(t => t ? { ...t, teams: [...t.teams, ...results] } : t);
// 팀 제외
setTournament(t => t ? { ...t, teams: t.teams.filter(tt => tt.team.id !== teamId) } : t);
// 팀 정보 수정
setTournament(t => t ? { ...t, teams: t.teams.map(tt => tt.team.id === team.id ? { ...tt, team } : tt) } : t);
// 득점 추가
setCurrentMatch(m => ({ ...m, goals: [...m.goals, goal], homeScore: hs, awayScore: as_ }));
// 득점 삭제
setCurrentMatch(m => ({ ...m, goals: m.goals.filter(g => g.id !== goalId), homeScore: hs, awayScore: as_ }));
// 협찬 추가
setTournament(t => t ? { ...t, sponsors: [...t.sponsors, sponsor] } : t);
// 협찬 수정
setTournament(t => t ? { ...t, sponsors: t.sponsors.map(s => s.id === id ? { ...s, ...data } : s) } : t);
// 협찬 삭제
setTournament(t => t ? { ...t, sponsors: t.sponsors.filter(s => s.id !== id) } : t);
```
