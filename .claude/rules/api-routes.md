# API Routes

| 경로 | 메서드 | 인증 | 반환 |
|------|--------|------|------|
| `/api/auth/login` | POST | - | `{ ok: true }` |
| `/api/auth/logout` | POST | - | `{ ok: true }` |
| `/api/tournaments` | GET | - | `Tournament[]` (active=true, _count 포함) |
| `/api/tournaments` | POST | ✓ | `Tournament` |
| `/api/tournaments/[id]` | GET | - | Tournament 전체 (teams+matches+goals+groups+sponsors, **players 없음**) |
| `/api/tournaments/[id]` | PATCH | ✓ | `Tournament` + revalidatePath |
| `/api/tournaments/[id]` | DELETE | ✓ | **소프트 삭제** `active=false` |
| `/api/tournaments/[id]/teams` | GET | - | `TournamentTeam[]` (**players 포함**) |
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
| `/api/teams` | GET | - | `Team[]` |
| `/api/teams` | POST | ✓ | `Team` |
| `/api/teams/[id]` | GET | - | `Team` (players 포함) |
| `/api/teams/[id]` | PATCH/DELETE | ✓ | `Team` / `{ ok: true }` |
| `/api/teams/[id]/players` | POST | ✓ | 단일: `Player` / 일괄 `{ players:[...] }`: `Player[]` |
| `/api/matches/[id]` | GET | - | `Match` (**players 포함**) |
| `/api/matches/[id]` | PATCH | ✓ | `Match` (양쪽 score 있으면 auto-FINISHED) |
| `/api/matches/[id]` | DELETE | ✓ | `{ ok: true }` |
| `/api/matches/[id]/goals` | POST | ✓ | 단일: `{ goal, homeScore, awayScore }` / 일괄: `{ goals, homeScore, awayScore }` |
| `/api/matches/[id]/goals` | DELETE | ✓ | `{ homeScore, awayScore }` |
| `/api/players/[id]` | PATCH/DELETE | ✓ | `Player` / `{ ok: true }` |

## 일괄 선수 추가
```ts
// body: { players: [...] } → prisma.player.createManyAndReturn()
```
