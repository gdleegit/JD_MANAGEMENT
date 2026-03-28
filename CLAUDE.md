# JD_MANAGEMENT — 개발 참조 문서

## 프로젝트 개요
축구 대회 관리 시스템. 토너먼트/리그/조별리그를 생성하고 경기 결과·득점을 기록하는 풀스택 웹앱.

- **스택**: Next.js 14 App Router, TypeScript, Tailwind CSS v4, Prisma 5 + PostgreSQL (Neon)
- **배포**: Vercel (자동 배포, main 브랜치)
- **DB**: `npx prisma db push` 방식 (migrations 없음)
- **로컬 .env**: `DATABASE_URL` = Neon PostgreSQL URL, `AUTH_SECRET` = 로컬 시크릿

---

## 디렉토리 구조

```
src/
├── app/
│   ├── page.tsx                          # redirect("/tournaments")
│   ├── layout.tsx                        # 헤더 nav + viewport meta
│   ├── globals.css                       # .btn .card .input .label .badge 유틸 클래스
│   ├── admin/
│   │   ├── page.tsx                      # 인증 확인 → AdminDashboard (DB fetch 없음)
│   │   └── login/page.tsx                # 로그인 폼
│   └── tournaments/
│       ├── page.tsx                      # revalidate=300
│       └── [id]/page.tsx                 # revalidate=60 + generateStaticParams
├── components/
│   ├── TournamentPublicView.tsx          # 공개 뷰 (7탭)
│   ├── BracketView.tsx                   # 토너먼트 대진표
│   ├── GroupStandingsView.tsx            # 조별 순위표
│   └── admin/
│       ├── AdminDashboard.tsx            # 클라이언트에서 /api/tournaments fetch
│       ├── TournamentsTab.tsx            # 대회 목록/생성
│       ├── TournamentEditor.tsx          # 5탭 편집 (matches/teams/groups/rules/info)
│       ├── MatchEditor.tsx               # 경기 결과 + 득점 기록
│       └── PlayerManager.tsx            # 선수 단일/일괄 추가
└── lib/
    ├── auth.ts                           # getSession(), createToken(), hashPassword()
    ├── prisma.ts                         # PrismaClient 싱글턴
    └── standings.ts                      # recalcGroupStandings(), recalcLeagueStandings()
```

---

## Prisma 스키마 모델

```
Tournament: id, name, type(KNOCKOUT|LEAGUE|GROUP), status(UPCOMING|ONGOING|FINISHED),
            startDate?, endDate?, description?, rules?, createdAt
            → teams(TournamentTeam[]), matches(Match[]), groups(Group[])

Team:        id, name, shortName?, color(default:#3b82f6), createdAt
             → players(Player[]), goals(Goal[]), homeMatches/awayMatches, groupTeams

TournamentTeam: id, tournamentId, teamId, seed?
                @@unique([tournamentId, teamId])

Player:      id, name, number?(Int), position?(GK|DF|MF|FW), teamId, createdAt

Match:       id, tournamentId, homeTeamId, awayTeamId,
             homeScore?, awayScore?, date?, venue?, court?, round?, stage?,
             status(default:SCHEDULED), groupId?, matchOrder?,
             referee?, assistantReferee1?, assistantReferee2?
             → goals(Goal[])

Goal:        id, matchId, playerId?, teamId, minute?, half?(1|2),
             type(default:GOAL | PENALTY | OWN_GOAL)

Group:       id, name, label?, color(default:#6366f1), tournamentId
             → teams(GroupTeam[]), matches(Match[])

GroupTeam:   id, groupId, teamId, played, won, drawn, lost, gf, ga, points
             @@unique([groupId, teamId])

AdminUser:   id, username(unique), password(SHA256), createdAt
```

---

## API 라우트 요약

| 경로 | 메서드 | 인증 | 반환 |
|------|--------|------|------|
| `/api/auth/login` | POST | - | `{ ok: true }` |
| `/api/auth/logout` | POST | - | `{ ok: true }` |
| `/api/tournaments` | GET | - | `Tournament[]` (include: _count) |
| `/api/tournaments` | POST | ✓ | `Tournament` |
| `/api/tournaments/[id]` | GET | - | 전체 Tournament (teams+matches+goals+groups, **players 없음**) |
| `/api/tournaments/[id]` | PATCH | ✓ | `Tournament` + revalidatePath |
| `/api/tournaments/[id]` | DELETE | ✓ | `{ ok: true }` |
| `/api/tournaments/[id]/teams` | GET | - | `TournamentTeam[]` (**players 포함**, 공개 lazy load용) |
| `/api/tournaments/[id]/teams` | POST | ✓ | `TournamentTeam` (include: team) |
| `/api/tournaments/[id]/teams` | DELETE | ✓ | `{ ok: true }` |
| `/api/tournaments/[id]/matches` | POST | ✓ | `Match` (include: homeTeam, awayTeam, group) |
| `/api/tournaments/[id]/groups` | POST | ✓ | `Group` |
| `/api/tournaments/[id]/groups/[groupId]` | PATCH | ✓ | `Group` |
| `/api/tournaments/[id]/groups/[groupId]` | DELETE | ✓ | `{ ok: true }` |
| `/api/tournaments/[id]/standings` | GET | - | `LeagueRow[]` |
| `/api/teams` | GET/POST | POST만 ✓ | `Team[]` / `Team` |
| `/api/teams/[id]` | GET/PATCH/DELETE | PATCH·DELETE만 ✓ | `Team` (GET: players 포함) |
| `/api/teams/[id]/players` | POST | ✓ | 단일: `Player`, 일괄: `{ players: [...] }` → `Player[]` |
| `/api/matches/[id]` | GET | - | `Match` (**players 포함**, 경기 편집용) |
| `/api/matches/[id]` | PATCH | ✓ | `Match` (auto-FINISHED if both scores) |
| `/api/matches/[id]` | DELETE | ✓ | `{ ok: true }` |
| `/api/matches/[id]/goals` | POST | ✓ | `{ goal, homeScore, awayScore }` |
| `/api/matches/[id]/goals` | DELETE | ✓ | `{ homeScore, awayScore }` |
| `/api/players/[id]` | PATCH/DELETE | ✓ | `Player` / `{ ok: true }` |

### revalidatePath 패턴
모든 관리자 변경 API는 다음을 호출:
```ts
revalidatePath(`/tournaments/${id}`);
revalidatePath("/tournaments");
```

---

## 핵심 타입 정의

```typescript
// 공통 사용 타입 (컴포넌트마다 로컬 정의됨)
type Player = { id: string; name: string; number?: number | null; position?: string | null }
type Team   = { id: string; name: string; shortName?: string | null; color?: string | null; players?: Player[] }
type Goal   = { id: string; type: string; teamId: string; minute?: number | null; half?: number | null;
                player?: { id: string; name: string } | null; team: Team }
type Match  = { id: string; homeTeam: Team; awayTeam: Team; homeScore?: number | null; awayScore?: number | null;
                date?: string | null; venue?: string | null; court?: string | null; round?: string | null;
                matchOrder?: number | null; status: string; goals: Goal[];
                group?: { id: string; name: string; label?: string | null; color?: string | null } | null;
                referee?: string | null; assistantReferee1?: string | null; assistantReferee2?: string | null }
type Group  = { id: string; name: string; label?: string | null; color?: string | null;
                teams: { id: string; team: Team; points: number; played: number; won: number;
                         drawn: number; lost: number; gf: number; ga: number }[] }
type Tournament = { id: string; name: string; type: string; status: string;
                    startDate?: string | null; endDate?: string | null;
                    description?: string | null; rules?: string | null;
                    teams: { id: string; team: Team }[]; matches: Match[]; groups: Group[] }
type LeagueRow = { teamId: string; team?: { name: string; color?: string | null };
                   played: number; won: number; drawn: number; lost: number;
                   gf: number; ga: number; gd: number; points: number }
```

---

## CSS 유틸 클래스 (globals.css)

```
.btn          기본 버튼 (min-height: 2.75rem, rounded-lg)
.btn-primary  파란 버튼
.btn-secondary 회색 버튼
.btn-danger   빨간 버튼
.btn-sm       작은 버튼 (min-height: 2.25rem)
.card         흰 카드 (rounded-xl, shadow-sm, border)
.input        인풋 (min-height: 2.75rem, font-size: 1rem, border-gray-300)
.label        라벨 (text-sm font-medium text-gray-700)
.badge        기본 뱃지 (inline-flex, rounded-full, text-xs)
.badge-blue   파란 뱃지
.badge-green  초록 뱃지
.badge-yellow 노란 뱃지
.badge-gray   회색 뱃지
```

---

## 상태 관리 패턴

### 관리자 화면 로컬 state 업데이트 (reload 없이)
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
```

### 공개 뷰 데이터 흐름
```
page.tsx (서버, revalidate=60)
  → DB: tournament without players (빠름)
  → TournamentPublicView (클라이언트)
      → useEffect: /api/tournaments/[id]/teams 로 players lazy load
```

### 관리자 데이터 흐름
```
admin/page.tsx (서버, force-dynamic)
  → 인증만 확인, DB fetch 없음
  → AdminDashboard (클라이언트)
      → useEffect: /api/tournaments 로 목록 fetch
      → TournamentEditor
          → 초기: /api/tournaments/[id] + /api/teams 병렬 fetch
          → 경기 편집 클릭: /api/matches/[id] 단독 fetch (players 포함)
          → 이후 변경: 로컬 state 업데이트 (DB 재조회 없음)
```

---

## 득점 계산 로직

```ts
// 정방향 골: 해당 팀 +1
// 자책골(OWN_GOAL): 상대팀 +1
homeScore = goals.filter(g => g.teamId === homeTeamId && g.type !== "OWN_GOAL").length
          + goals.filter(g => g.teamId === awayTeamId && g.type === "OWN_GOAL").length;
awayScore = goals.filter(g => g.teamId === awayTeamId && g.type !== "OWN_GOAL").length
          + goals.filter(g => g.teamId === homeTeamId && g.type === "OWN_GOAL").length;
```

---

## 인증 구조

```ts
// 토큰: base64(username:timestamp) — 쿠키 "admin-token"
// 세션: 7일 유효
// admin 계정: 비밀번호 없이 로그인 가능 (개발 편의)
// 기타 계정: SHA256(password + AUTH_SECRET) 검증
```

---

## 공개 뷰 탭 구성 (TournamentPublicView)

| 탭 | KNOCKOUT | LEAGUE | GROUP |
|----|----------|--------|-------|
| 대진표 | ✓ | - | - |
| 순위표 | - | ✓ | - |
| 리그별 순위 | - | - | ✓ |
| 날짜별 일정 | ✓ | ✓ | ✓ |
| 득점 순위 | ✓ | ✓ | ✓ (조별) |
| 참가팀 | ✓ | ✓ | ✓ |
| 운영규칙 | rules 있을 때만 | | |

### MatchCard 특징
- 그룹 있으면 왼쪽 4px 컬러 보더 + 배경 틴트
- 상태 배지: 항상 오른쪽 상단 고정 (flex-shrink-0)
- 득점 기록: half 있으면 전반/후반 섹션 분리 + 부분 스코어 표시
- 날짜별 일정: 날짜 pill 선택 기능, 오늘 자동 선택

---

## 주요 개발 주의사항

1. **players 포함 여부**:
   - `/api/tournaments/[id]` GET → **players 없음** (속도 위해 제거됨)
   - `/api/matches/[id]` GET → **players 있음** (MatchEditor용)
   - `/api/tournaments/[id]/teams` GET → **players 있음** (공개 뷰 lazy load용)

2. **DB push 후 Vercel**: 스키마 변경 시 `npx prisma db push` 실행 필요, Vercel은 `prisma generate`만 실행

3. **시간대**: 모든 날짜/시간 표시에 `timeZone: "Asia/Seoul"` 필수 (서버/클라이언트 hydration 불일치 방지)

4. **캐시 무효화**: 관리자 변경 API에서 `revalidatePath` 호출 필수

5. **선수 정렬**: number ASC (null 마지막), 동점 시 name localeCompare("ko", { numeric: true })

6. **일괄 선수 추가**: `{ players: [...] }` body → `prisma.player.createManyAndReturn()`

7. **모바일**: `sm:` 브레이크포인트 기준, min-height 2.75rem 터치 타겟, font-size 1rem (iOS 줌 방지)
