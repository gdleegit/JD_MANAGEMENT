import { prisma } from "./prisma";

export async function recalcGroupStandings(groupId: string) {
  const matches = await prisma.match.findMany({
    where: { groupId, status: "FINISHED" },
    include: { homeTeam: true, awayTeam: true },
  });

  const groupTeams = await prisma.groupTeam.findMany({ where: { groupId } });
  const stats: Record<string, { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number }> = {};

  for (const gt of groupTeams) {
    stats[gt.teamId] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
  }

  for (const m of matches) {
    if (m.homeScore === null || m.awayScore === null) continue;
    const h = m.homeTeamId;
    const a = m.awayTeamId;
    if (!stats[h] || !stats[a]) continue;

    stats[h].played++;
    stats[a].played++;
    stats[h].gf += m.homeScore;
    stats[h].ga += m.awayScore;
    stats[a].gf += m.awayScore;
    stats[a].ga += m.homeScore;

    if (m.homeScore > m.awayScore) {
      stats[h].won++; stats[h].points += 3;
      stats[a].lost++;
    } else if (m.homeScore < m.awayScore) {
      stats[a].won++; stats[a].points += 3;
      stats[h].lost++;
    } else {
      stats[h].drawn++; stats[h].points++;
      stats[a].drawn++; stats[a].points++;
    }
  }

  for (const gt of groupTeams) {
    const s = stats[gt.teamId];
    if (!s) continue;
    await prisma.groupTeam.update({
      where: { id: gt.id },
      data: s,
    });
  }
}

export async function recalcLeagueStandings(tournamentId: string) {
  // For league, use a virtual group per tournament
  const matches = await prisma.match.findMany({
    where: { tournamentId, status: "FINISHED" },
  });

  const tTeams = await prisma.tournamentTeam.findMany({ where: { tournamentId } });
  const stats: Record<string, { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number }> = {};

  for (const tt of tTeams) stats[tt.teamId] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };

  for (const m of matches) {
    if (m.homeScore === null || m.awayScore === null) continue;
    const h = m.homeTeamId; const a = m.awayTeamId;
    if (!stats[h] || !stats[a]) continue;
    stats[h].played++; stats[a].played++;
    stats[h].gf += m.homeScore; stats[h].ga += m.awayScore;
    stats[a].gf += m.awayScore; stats[a].ga += m.homeScore;
    if (m.homeScore > m.awayScore) { stats[h].won++; stats[h].points += 3; stats[a].lost++; }
    else if (m.homeScore < m.awayScore) { stats[a].won++; stats[a].points += 3; stats[h].lost++; }
    else { stats[h].drawn++; stats[h].points++; stats[a].drawn++; stats[a].points++; }
  }

  return Object.entries(stats)
    .map(([teamId, s]) => ({ teamId, ...s, gd: s.gf - s.ga }))
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
}
