# UI Components

## 디렉토리 구조
```
src/
├── app/
│   ├── page.tsx                    # redirect("/tournaments")
│   ├── layout.tsx                  # 헤더 nav + viewport meta
│   ├── globals.css                 # 유틸 클래스
│   ├── admin/
│   │   ├── page.tsx                # 인증 확인 → AdminDashboard
│   │   └── login/page.tsx
│   └── tournaments/
│       ├── page.tsx                # revalidate=300, 진행중 우선 정렬
│       └── [id]/page.tsx           # revalidate=60 + generateStaticParams
├── components/
│   ├── TournamentPublicView.tsx
│   ├── BracketView.tsx
│   ├── GroupStandingsView.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── TournamentsTab.tsx      # 소프트 삭제
│       ├── TournamentEditor.tsx    # 6탭: matches/teams/groups/rules/sponsors/info
│       ├── MatchEditor.tsx         # 득점 기록, bulk 저장
│       ├── PlayerManager.tsx
│       └── SaveButton.tsx
└── lib/
    ├── auth.ts                     # getSession(), createToken(), hashPassword()
    ├── prisma.ts                   # PrismaClient 싱글턴
    └── standings.ts                # recalcGroupStandings(), recalcLeagueStandings()
```

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
.badge-blue / .badge-green / .badge-yellow / .badge-gray
```

## SaveButton 컴포넌트
```tsx
<SaveButton onClick={asyncFn} label="저장" size="sm" className="w-full" disabled={!valid} />
// idle: 파란 | saving: 스피너+"저장 중..." | saved: 초록+체크+"저장됨"(1.8초 후 복귀)
```

## 헤더 브랜딩 (layout.tsx)
- 폰트: `Bebas_Neue` (Athletic Archive) + `Noto_Serif_KR` (中東)
- 로고: `public/jd2.svg` — `<img>` 태그 46px
- 탭 제목: `中東AA | Athletic Archive`
- 레이아웃: `[로고] [中東(32px)] [| 구분선] [Athletic Archive(15px)]`
- JOONGDONG: 각 글자 개별 `<span>` + `flex justify-between` → 中東 폭에 맞춤
- Athletic Archive 'A' 색: `#176fc1`

## 공개 뷰 탭 구성 (TournamentPublicView)

| 탭 | KNOCKOUT | LEAGUE | GROUP | 조건 |
|----|:--------:|:------:|:-----:|------|
| 대진표 | ✓ | - | - | |
| 순위표 | - | ✓ | - | |
| 리그별 순위 | - | - | ✓ | |
| 날짜별 일정 | ✓ | ✓ | ✓ | |
| 득점 순위 | ✓ | ✓ | ✓ | |
| 참가팀 | ✓ | ✓ | ✓ | |
| 운영규칙 | ✓ | ✓ | ✓ | rules 있을 때만 |
| 협찬·후원 | ✓ | ✓ | ✓ | sponsors 있을 때만 |

## MatchCard 특징
- 그룹 있으면 왼쪽 4px 컬러 보더 + 배경 틴트
- 상태 배지: 항상 오른쪽 상단 `flex-shrink-0`
- half 있으면 전반/후반 섹션 분리 + 부분 스코어
- 날짜 pill: 선택 기능, 오늘 자동 선택

## GROUP 리그 선택기 (DivisionView)
- "전체" 버튼(`activeGroup=null`) → 순위표만 표시
- `getContrastColor(hex)` → 배경 밝기로 글자색(흰/검) 자동 결정

## 운영규칙 렌더러 (RulesRenderer)
- `1.` `2.` → 파란 원형 번호 + 굵은 섹션 제목
- `-` 시작 → 들여쓰기 불릿
- 나머지 → 일반 단락

## 협찬 섹션 (SponsorSection)
- 정렬: TITLE → SPONSOR → SUPPORT
- 행: `[타입라벨] [로고?] [이름] | [기수뱃지?] [부제?]`
- TITLE 뱃지: `bg-blue-600 text-white` / SPONSOR·SUPPORT: `bg-blue-100 text-blue-700`
- 홈 목록: 대회 카드 바로 아래 (없으면 미표시)
