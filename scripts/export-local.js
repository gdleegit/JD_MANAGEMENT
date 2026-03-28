// 로컬 SQLite 데이터를 JSON으로 내보내기
// 실행: node scripts/export-local.js
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();

async function main() {
  const [adminUsers, teams, players, tournaments, tournamentTeams, groups, groupTeams, matches, goals] = await Promise.all([
    prisma.adminUser.findMany(),
    prisma.team.findMany(),
    prisma.player.findMany(),
    prisma.tournament.findMany(),
    prisma.tournamentTeam.findMany(),
    prisma.group.findMany(),
    prisma.groupTeam.findMany(),
    prisma.match.findMany(),
    prisma.goal.findMany(),
  ]);

  const data = { adminUsers, teams, players, tournaments, tournamentTeams, groups, groupTeams, matches, goals };
  fs.writeFileSync("scripts/local-data.json", JSON.stringify(data, null, 2));
  console.log("✅ 내보내기 완료 → scripts/local-data.json");
  console.log(`   대회: ${tournaments.length}, 팀: ${teams.length}, 경기: ${matches.length}, 선수: ${players.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
