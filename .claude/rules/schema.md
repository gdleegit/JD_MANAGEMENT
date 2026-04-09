# Schema & Types

## Prisma 모델 요약

```
Tournament: id, name, sport(FOOTBALL), type(KNOCKOUT|LEAGUE|GROUP),
            status(UPCOMING|ONGOING|FINISHED), active(default:true),
            startDate?, endDate?, description?, rules?, createdAt
            → teams, matches, groups, sponsors

Team:        id, name, shortName?, color(default:#3b82f6)
             → players, goals, homeMatches, awayMatches

TournamentTeam: tournamentId + teamId @@unique

Player:      id, name, number?(Int), position?(GK|DF|MF|FW), teamId

Match:       id, tournamentId, homeTeamId, awayTeamId,
             homeScore?, awayScore?, date?, venue?, court?, round?,
             stage?, status(SCHEDULED), groupId?, matchOrder?,
             referee?, assistantReferee1?, assistantReferee2?, videoUrl?
             → goals(Goal[])

Goal:        id, matchId, playerId?, teamId, minute?, half?(1|2),
             type(GOAL|PENALTY|OWN_GOAL)

Group:       id, name, label?, color(default:#6366f1), sortOrder(0), tournamentId
             → teams(GroupTeam[]), matches

GroupTeam:   groupId + teamId @@unique
             played, won, drawn, lost, gf, ga, points

Sponsor:     id, tournamentId, name, grade?, description?, logoUrl?, link?,
             type(SPONSOR|TITLE|SUPPORT), order(0)

AdminUser:   id, username(unique), password(SHA256)
```

## TypeScript 타입

```typescript
type Player  = { id: string; name: string; number?: number | null; position?: string | null }
type Team    = { id: string; name: string; shortName?: string | null; color?: string | null; players?: Player[] }
type Goal    = { id: string; type: string; teamId: string; minute?: number | null; half?: number | null;
                 player?: { id: string; name: string } | null; team: Team }
type Match   = { id: string; homeTeam: Team; awayTeam: Team; homeScore?: number | null; awayScore?: number | null;
                 date?: string | null; venue?: string | null; court?: string | null; round?: string | null;
                 matchOrder?: number | null; status: string; goals: Goal[];
                 group?: { id: string; name: string; label?: string | null; color?: string | null } | null;
                 referee?: string | null; assistantReferee1?: string | null; assistantReferee2?: string | null;
                 videoUrl?: string | null }
type Group   = { id: string; name: string; label?: string | null; color?: string | null; sortOrder?: number | null;
                 teams: { id: string; team: Team; points: number; played: number;
                          won: number; drawn: number; lost: number; gf: number; ga: number }[] }
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
