# JD_MANAGEMENT

축구 대회 관리 시스템 — 토너먼트/리그/조별리그 생성, 경기 결과·득점 기록 풀스택 웹앱.

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS v4
- Prisma 5 + PostgreSQL (Supabase)
- 배포: Vercel (main 브랜치 자동 배포)

## 절대 금지
- `prisma migrate` 또는 `--force-reset` 사용 금지 → 스키마 변경은 `npx prisma db push`만 사용
- `<Image>` 컴포넌트로 SVG 렌더링 금지 → `<img>` 태그 사용 (`eslint-disable-next-line @next/next/no-img-element`)
- 대회 DELETE는 실제 삭제 금지 → `active=false` 소프트 삭제만

## 핵심 규칙

**날짜/시간**: 모든 표시에 `timeZone: "Asia/Seoul"` 필수 (hydration 불일치 방지)

**players 포함 여부**:
- `/api/tournaments/[id]` → players 없음 (속도 최적화)
- `/api/matches/[id]` → players 있음 (MatchEditor용)
- `/api/tournaments/[id]/teams` → players 있음 (공개 뷰 lazy load)

**캐시 무효화**: 모든 관리자 변경 API 끝에 반드시 호출
```ts
revalidatePath(`/tournaments/${id}`);
revalidatePath("/tournaments");
```

**득점 계산**: 자책골은 상대팀 점수에 반영
```ts
homeScore = goals.filter(g => g.teamId === homeTeamId && g.type !== "OWN_GOAL").length
          + goals.filter(g => g.teamId === awayTeamId && g.type === "OWN_GOAL").length;
```

**MatchEditor race condition 방지**: pending goals 있으면 PATCH body에서 homeScore/awayScore 제외
```ts
if (pendingGoals.length === 0) { body.homeScore = ...; body.awayScore = ...; }
await Promise.all([matchFetch, goalsFetch]);
```

**선수 정렬**: `number ASC (null 마지막)`, 동점 시 `name.localeCompare("ko", { numeric: true })`

**모바일**: min-height 2.75rem 터치 타겟, font-size 1rem (iOS 줌 방지), `sm:` 브레이크포인트

**public 파일**: 신규 파일은 반드시 `git add` 후 커밋해야 Vercel 배포에 포함

## 상태 관리 원칙
관리자 화면은 API 응답 후 로컬 state 업데이트 (reload/재조회 없음):
```ts
// 예시: 경기 추가
setTournament(t => t ? { ...t, matches: [...t.matches, { ...newMatch, goals: [] }] } : t);
```
→ 패턴 상세: `.claude/rules/state-patterns.md`

## 인증
- 토큰: `base64(username:timestamp)` — 쿠키 `admin-token`, 7일 유효
- admin 계정: 비밀번호 없이 로그인 가능
- 기타: `SHA256(password + AUTH_SECRET)` 검증

## 선수 이름 컨벤션
- 단일 기수 팀(72·73·74·79·83회 등): 이름만, 기수는 `number` 필드
- 혼합 기수 팀: 이름에 기수 포함 → `"김성중(80회)"`
- 선출 선수: `"박춘일(선출)"`, `position: "선출"`

## 세부 참조 (필요할 때만 읽기)
- 스키마 + 타입: `.claude/rules/schema.md`
- API 라우트 전체: `.claude/rules/api-routes.md`
- UI 컴포넌트/CSS: `.claude/rules/ui-components.md`
- 데이터 흐름: `.claude/rules/data-flow.md`
