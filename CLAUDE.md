# JD_MANAGEMENT — 개발 참조 문서

## 프로젝트 개요
축구 대회 관리 시스템. 토너먼트/리그/조별리그를 생성하고 경기 결과·득점을 기록하는 풀스택 웹앱.

- **스택**: Next.js 14 App Router, TypeScript, Tailwind CSS v4, Prisma 5 + PostgreSQL (Supabase)
- **배포**: Vercel (자동 배포, main 브랜치)
- **DB**: `npx prisma db push` 방식 (migrations 없음, **절대 --force-reset 금지**)
- **로컬 .env**: `DATABASE_URL` + `DIRECT_URL` = Supabase PostgreSQL URL, `AUTH_SECRET` = 로컬 시크릿

---

## 헤더 브랜딩 구조 (layout.tsx)

- **폰트**: `Bebas_Neue` (Athletic Archive) + `Noto_Serif_KR` (中東) — next/font/google
- **로고**: `public/jd2.svg` — 흰 원형 + 파란 링/텍스트(#176fc1, #2252ab). Next.js `<Image>` 대신 `<img>` 태그 사용 (SVG 렌더링 안정성)
- **브라우저 탭**: `中東AA | Athletic Archive`
- **헤더 레이아웃** (가로):
  ```
  [jd2.svg 로고 46px]  [中東(Noto Serif KR 32px)]  [| 구분선]  [Athletic Archive(Bebas Neue 15px)]
                        [JOONGDONG (6px, flex justify-between으로 中東 넓이 맞춤)]
  ```
- **Athletic Archive** A 색상: `#176fc1` (로고 파란색)
- **JOONGDONG**: 각 글자를 개별 `<span>`으로 분리 후 `flex justify-between` → 中東 넓이에 정확히 맞춤

---

## 디렉토리 구조

```
src/
├── app/
│   ├── page.tsx                          # redirect("/tournaments")
│   ├── layout.tsx                        # 헤더 nav + viewport meta (Bebas_Neue, Noto_Serif_KR)
│   ├── globals.css                       # .btn .card .input .label .badge 유틸 클래스
│   ├── admin/
│   │   ├── page.tsx                      # 인증 확인 → AdminDashboard (DB fetch 없음)
│   │   └── login/page.tsx                # 로그인 폼
│   └── tournaments/
│       ├── page.tsx                      # revalidate=300, 진행중 우선 정렬
│       └── [id]/page.tsx                 # revalidate=60 + generateStaticParams
├── components/
│   ├── TournamentPublicView.tsx          # 공개 뷰 (탭 구성 아래 참조)
│   ├── BracketView.tsx                   # 토너먼트 대진표
│   ├── GroupStandingsView.tsx            # 조별 순위표
│   └── admin/
│       ├── AdminDashboard.tsx            # 클라이언트에서 /api/tournaments fetch
│       ├── TournamentsTab.tsx            # 대회 목록/생성 (소프트 삭제)
│       ├── TournamentEditor.tsx          # 6탭 편집 (matches/teams/groups/rules/sponsors/info)
│       ├── MatchEditor.tsx               # 경기 결과 + 득점 기록 (bulk 저장)
│       ├── PlayerManager.tsx             # 선수 단일/일괄 추가
│       └── SaveButton.tsx                # 저장 버튼 공통 컴포넌트 (idle/saving/saved 상태)
└── lib/
    ├── auth.ts                           # getSession(), createToken(), hashPassword()
    ├── prisma.ts                         # PrismaClient 싱글턴
    └── standings.ts                      # recalcGroupStandings(), recalcLeagueStandings()
```

---

## Prisma 스키마 모델

```
Tournament: id, name, sport(default:FOOTBALL), type(KNOCKOUT|LEAGUE|GROUP),
            status(UPCOMING|ONGOING|FINISHED), active(default:true),
            startDate?, endDate?, description?, rules?, createdAt
            → teams(TournamentTeam[]), matches(Match[]), groups(Group[]), sponsors(Sponsor[])

Team:        id, name, shortName?, color(default:#3b82f6), createdAt
             → players(Player[]), goals(Goal[]), homeMatches/awayMatches, groupTeams

TournamentTeam: id, tournamentId, teamId, seed?
                @@unique([tournamentId, teamId])

Player:      id, name, number?(Int), position?(GK|DF|MF|FW), teamId, createdAt

Match:       id, tournamentId, homeTeamId, awayTeamId,
             homeScore?, awayScore?, date?, venue?, court?, round?, stage?,
             status(default:SCHEDULED), groupId?, matchOrder?,
             referee?, assistantReferee1?, assistantReferee2?, videoUrl?
             → goals(Goal[])

Goal:        id, matchId, playerId?, teamId, minute?, half?(1|2),
             type(default:GOAL | PENALTY | OWN_GOAL)

Group:       id, name, label?, color(default:#6366f1), sortOrder(default:0), tournamentId
             → teams(GroupTeam[]), matches(Match[])

GroupTeam:   id, groupId, teamId, played, won, drawn, lost, gf, ga, points
             @@unique([groupId, teamId])

Sponsor:     id, tournamentId, name, grade?, description?, logoUrl?, link?,
             type(default:SPONSOR | TITLE | SUPPORT), order(default:0), createdAt

AdminUser:   id, username(unique), password(SHA256), createdAt
```

---

## API 라우트 요약

| 경로 | 메서드 | 인증 | 반환 |
|------|--------|------|------|
| `/api/auth/login` | POST | - | `{ ok: true }` |
| `/api/auth/logout` | POST | - | `{ ok: true }` |
| `/api/tournaments` | GET | - | `Tournament[]` (where active=true, include: _count) |
| `/api/tournaments` | POST | ✓ | `Tournament` |
| `/api/tournaments/[id]` | GET | - | 전체 Tournament (teams+matches+goals+groups+sponsors, **players 없음**) |
| `/api/tournaments/[id]` | PATCH | ✓ | `Tournament` + revalidatePath |
| `/api/tournaments/[id]` | DELETE | ✓ | **소프트 삭제** — `active=false` 업데이트 (데이터 유지) |
| `/api/tournaments/[id]/teams` | GET | - | `TournamentTeam[]` (**players 포함**, 공개 lazy load용) |
| `/api/tournaments/[id]/teams` | POST | ✓ | `TournamentTeam` (include: team) |
| `/api/tournaments/[id]/teams` | DELETE | ✓ | `{ ok: true }` |
| `/api/tournaments/[id]/matches` | POST | ✓ | `Match` (include: homeTeam, awayTeam, group) |
| `/api/tournaments/[id]/groups` | POST | ✓ | `Group` |
| `/api/tournaments/[id]/groups/[groupId]` | PATCH | ✓ | `Group` + revalidatePath |
| `/api/tournaments/[id]/groups/[groupId]` | DELETE | ✓ | `{ ok: true }` + revalidatePath |
| `/api/tournaments/[id]/standings` | GET | - | `LeagueRow[]` |
| `/api/tournaments/[id]/sponsors` | GET | - | `Sponsor[]` |
| `/api/tournaments/[id]/sponsors` | POST | ✓ | `Sponsor` + revalidatePath |
| `/api/sponsors/[id]` | PATCH | ✓ | `Sponsor` + revalidatePath |
| `/api/sponsors/[id]` | DELETE | ✓ | `{ ok: true }` + revalidatePath |
| `/api/teams` | GET/POST | POST만 ✓ | `Team[]` / `Team` |
| `/api/teams/[id]` | GET/PATCH/DELETE | PATCH·DELETE만 ✓ | `Team` (GET: players 포함) |
| `/api/teams/[id]/players` | POST | ✓ | 단일: `Player`, 일괄: `{ players: [...] }` → `Player[]` |
| `/api/matches/[id]` | GET | - | `Match` (**players 포함**, 경기 편집용) |
| `/api/matches/[id]` | PATCH | ✓ | `Match` (auto-FINISHED if both scores) |
| `/api/matches/[id]` | DELETE | ✓ | `{ ok: true }` |
| `/api/matches/[id]/goals` | POST | ✓ | 단일: `{ goal, homeScore, awayScore }` / 일괄: `{ goals:[...] }` → `{ goals, homeScore, awayScore }` |
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
type Player = { id: string; name: string; number?: number | null; position?: string | null }
type Team   = { id: string; name: string; shortName?: string | null; color?: string | null; players?: Player[] }
type Goal   = { id: string; type: string; teamId: string; minute?: number | null; half?: number | null;
                player?: { id: string; name: string } | null; team: Team }
type Match  = { id: string; homeTeam: Team; awayTeam: Team; homeScore?: number | null; awayScore?: number | null;
                date?: string | null; venue?: string | null; court?: string | null; round?: string | null;
                matchOrder?: number | null; status: string; goals: Goal[];
                group?: { id: string; name: string; label?: string | null; color?: string | null } | null;
                referee?: string | null; assistantReferee1?: string | null; assistantReferee2?: string | null;
                videoUrl?: string | null }
type Group  = { id: string; name: string; label?: string | null; color?: string | null; sortOrder?: number | null;
                teams: { id: string; team: Team; points: number; played: number; won: number;
                         drawn: number; lost: number; gf: number; ga: number }[] }
type Sponsor = { id: string; name: string; grade?: string | null; description?: string | null;
                 logoUrl?: string | null; link?: string | null; type: string; order: number }
type Tournament = { id: string; name: string; sport: string; type: string; status: string;
                    startDate?: string | null; endDate?: string | null;
                    description?: string | null; rules?: string | null;
                    teams: { id: string; team: Team }[]; matches: Match[];
                    groups: Group[]; sponsors: Sponsor[] }
type LeagueRow = { teamId: string; team?: { name: string; color?: string | null };
                   played: number; won: number; drawn: number; lost: number;
                   gf: number; ga: number; gd: number; points: number }
```

---

## CSS 유틸 클래스 (globals.css)

```
.btn           기본 버튼 (min-height: 2.75rem, rounded-lg)
.btn-primary   파란 버튼
.btn-secondary 회색 버튼
.btn-danger    빨간 버튼
.btn-sm        작은 버튼 (min-height: 2.25rem)
.card          흰 카드 (rounded-xl, shadow-sm, border)
.input         인풋 (min-height: 2.75rem, font-size: 1rem, border-gray-300)
.label         라벨 (text-sm font-medium text-gray-700)
.badge         기본 뱃지 (inline-flex, rounded-full, text-xs)
.badge-blue    파란 뱃지
.badge-green   초록 뱃지
.badge-yellow  노란 뱃지
.badge-gray    회색 뱃지
```

### SaveButton 컴포넌트 (`src/components/admin/SaveButton.tsx`)
모든 관리자 저장 버튼에 사용. `onClick: () => Promise<void>` 를 받아 내부에서 상태 관리.
```tsx
<SaveButton onClick={asyncFn} label="저장" size="sm" className="w-full" disabled={!valid} />
// idle: 파란 버튼 | saving: 스피너+"저장 중..." | saved: 초록+체크+"저장됨"(1.8초)
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
// 협찬 추가
setTournament(t => t ? { ...t, sponsors: [...t.sponsors, sponsor] } : t);
// 협찬 수정
setTournament(t => t ? { ...t, sponsors: t.sponsors.map(s => s.id === id ? { ...s, ...data } : s) } : t);
// 협찬 삭제
setTournament(t => t ? { ...t, sponsors: t.sponsors.filter(s => s.id !== id) } : t);
```

### 공개 뷰 데이터 흐름
```
tournaments/page.tsx (서버, revalidate=300)
  → DB: tournament 목록, 진행중 우선 / startDate 최신순 정렬
  → 대회 카드 + 협찬 배너(카드 아래)

[id]/page.tsx (서버, revalidate=60)
  → DB: tournament (teams+matches+goals+groups+sponsors, players 없음)
  → TournamentPublicView (클라이언트)
      → useEffect: /api/tournaments/[id]/teams 로 players lazy load
```

### 관리자 데이터 흐름
```
admin/page.tsx (서버, force-dynamic)
  → 인증만 확인, DB fetch 없음
  → AdminDashboard (클라이언트)
      → useEffect: /api/tournaments 로 목록 fetch (active=true만)
      → TournamentEditor
          → 초기: /api/tournaments/[id] + /api/teams 병렬 fetch
          → 경기 편집 클릭: /api/matches/[id] 단독 fetch (players 포함)
          → 이후 변경: 로컬 state 업데이트 (DB 재조회 없음)
```

---

## 득점 계산 로직

```ts
// 정방향 골: 해당 팀 +1 / 자책골(OWN_GOAL): 상대팀 +1
homeScore = goals.filter(g => g.teamId === homeTeamId && g.type !== "OWN_GOAL").length
          + goals.filter(g => g.teamId === awayTeamId && g.type === "OWN_GOAL").length;
awayScore = goals.filter(g => g.teamId === awayTeamId && g.type !== "OWN_GOAL").length
          + goals.filter(g => g.teamId === homeTeamId && g.type === "OWN_GOAL").length;
```

### MatchEditor 저장 패턴 (race condition 방지)
```ts
// pending goals 있을 때 PATCH에 homeScore/awayScore 제외 → bulk goals POST가 재계산 담당
if (pendingGoals.length === 0) {
  matchPatchBody.homeScore = parsedHome;
  matchPatchBody.awayScore = parsedAway;
}
await Promise.all([matchFetch, goalsFetch]);
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

| 탭 | KNOCKOUT | LEAGUE | GROUP | 표시 조건 |
|----|----------|--------|-------|-----------|
| 대진표 | ✓ | - | - | |
| 순위표 | - | ✓ | - | |
| 리그별 순위 | - | - | ✓ | |
| 날짜별 일정 | ✓ | ✓ | ✓ | |
| 득점 순위 | ✓ | ✓ | ✓ | |
| 참가팀 | ✓ | ✓ | ✓ | |
| 운영규칙 | ✓ | ✓ | ✓ | rules 있을 때만 |
| 협찬·후원 | ✓ | ✓ | ✓ | sponsors 있을 때만 |

### MatchCard 특징
- 그룹 있으면 왼쪽 4px 컬러 보더 + 배경 틴트
- 상태 배지: 항상 오른쪽 상단 고정 (flex-shrink-0)
- 득점 기록: half 있으면 전반/후반 섹션 분리 + 부분 스코어 표시
- 날짜별 일정: 날짜 pill 선택 기능, 오늘 자동 선택

### GROUP 타입 리그 선택기 (DivisionView)
- 날짜 pill 스타일 버튼으로 리그 선택
- "전체" 버튼(activeGroup=null) 선택 시 순위표만 표시
- `getContrastColor(hex)` 함수로 배경색 밝기에 따라 글자색(흰/검) 자동 결정

### 운영규칙 탭 (RulesRenderer)
- `1.` `2.` 숫자 헤더 → 파란 원형 번호 + 굵은 섹션 제목
- `-` 으로 시작하는 줄 → 들여쓰기 불릿 항목
- 나머지 → 일반 텍스트 단락

### 협찬·후원 섹션 레이아웃 (SponsorSection)
- TITLE → SPONSOR → SUPPORT 순 정렬, 각 항목 한 행
- 행 구성: `[타입라벨] [로고?] [이름] | [기수뱃지?] [부제?]`
- 기수 뱃지: TITLE=`bg-blue-600 text-white`, SPONSOR/SUPPORT=`bg-blue-100 text-blue-700`
- 홈 목록: 대회 카드 바로 아래에 배치 (협찬 없으면 미표시)

### 관리자 UI 주요 사항
- **TournamentEditor 헤더**: 대회명 클릭 → 인라인 편집 (저장 시 API PATCH + 로컬 state 업데이트)
- **TournamentEditor 탭**: matches / teams / groups / rules / sponsors / info (6탭)
- **SponsorsTab 필드**: 기수(grade) / 이름(name) / 유형 / 부제 / 로고URL / 링크URL
- **TournamentsTab 삭제**: 소프트 삭제 (active=false) — DB에서 직접 삭제해야 완전 제거
- **MatchEditor**: pending goals 로컬 누적 후 한 번에 bulk 저장

---

## 대회 목록 정렬 (tournaments/page.tsx)
```ts
// DB: startDate DESC (null 마지막), createdAt DESC
// JS: ONGOING 상태 먼저, 나머지는 DB 순서 유지
const tournaments = [...rawTournaments].sort((a, b) => {
  const sa = calcStatus(a) === "ONGOING" ? 0 : 1;
  const sb = calcStatus(b) === "ONGOING" ? 0 : 1;
  return sa - sb;
});
```

---

## 주요 개발 주의사항

1. **players 포함 여부**:
   - `/api/tournaments/[id]` GET → **players 없음** (속도 위해 제거됨)
   - `/api/matches/[id]` GET → **players 있음** (MatchEditor용)
   - `/api/tournaments/[id]/teams` GET → **players 있음** (공개 뷰 lazy load용)

2. **DB push 후 Vercel**: 스키마 변경 시 `npx prisma db push` 실행 필요, Vercel은 `prisma generate`만 실행

3. **시간대**: 모든 날짜/시간 표시에 `timeZone: "Asia/Seoul"` 필수 (서버/클라이언트 hydration 불일치 방지)

4. **캐시 무효화**: 관리자 변경 API에서 `revalidatePath` 호출 필수. groups PATCH/DELETE도 포함.

5. **선수 정렬**: number ASC (null 마지막), 동점 시 name localeCompare("ko", { numeric: true })

6. **일괄 선수 추가**: `{ players: [...] }` body → `prisma.player.createManyAndReturn()`

7. **모바일**: `sm:` 브레이크포인트 기준, min-height 2.75rem 터치 타겟, font-size 1rem (iOS 줌 방지)

8. **SVG 로고**: Next.js `<Image>` 컴포넌트 대신 `<img>` 태그 사용 (`eslint-disable-next-line @next/next/no-img-element` 주석 필요)

9. **public 파일 커밋**: `public/` 내 신규 파일은 반드시 git add 후 커밋해야 Vercel 배포에 포함됨

10. **소프트 삭제**: 대회 DELETE API는 실제 삭제가 아닌 `active=false` 처리. 목록 조회 시 `where: { active: true }` 필터 필수.

11. **선수 이름 컨벤션**:
    - 단일 기수 팀(72·73·74·79·83회 등): 이름만, 등번호는 `number` 필드
    - 혼합 기수 팀(80-81회, 연합팀): 이름에 기수 포함 예) `"김성중(80회)"`
    - 선출 선수: 이름에 표기 예) `"박춘일(선출)"`, `position: "선출"`
