// Neon PostgreSQL로 데이터 가져오기
// 실행: node scripts/import-to-neon.js
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync("scripts/local-data.json", "utf8"));

  // 순서대로 삽입 (외래키 의존성 순)
  for (const row of data.adminUsers) {
    await prisma.adminUser.upsert({ where: { username: row.username }, update: row, create: row });
  }
  console.log(`✅ adminUsers: ${data.adminUsers.length}`);

  for (const row of data.teams) {
    await prisma.team.upsert({ where: { id: row.id }, update: row, create: row });
  }
  console.log(`✅ teams: ${data.teams.length}`);

  for (const row of data.players) {
    await prisma.player.upsert({ where: { id: row.id }, update: row, create: row });
  }
  console.log(`✅ players: ${data.players.length}`);

  for (const row of data.tournaments) {
    await prisma.tournament.upsert({ where: { id: row.id }, update: row, create: row });
  }
  console.log(`✅ tournaments: ${data.tournaments.length}`);

  for (const row of data.tournamentTeams) {
    await prisma.tournamentTeam.upsert({ where: { id: row.id }, update: row, create: row });
  }
  console.log(`✅ tournamentTeams: ${data.tournamentTeams.length}`);

  for (const row of data.groups) {
    await prisma.group.upsert({ where: { id: row.id }, update: row, create: row });
  }
  console.log(`✅ groups: ${data.groups.length}`);

  for (const row of data.groupTeams) {
    await prisma.groupTeam.upsert({ where: { id: row.id }, update: row, create: row });
  }
  console.log(`✅ groupTeams: ${data.groupTeams.length}`);

  for (const row of data.matches) {
    await prisma.match.upsert({ where: { id: row.id }, update: row, create: row });
  }
  console.log(`✅ matches: ${data.matches.length}`);

  for (const row of data.goals) {
    await prisma.goal.upsert({ where: { id: row.id }, update: row, create: row });
  }
  console.log(`✅ goals: ${data.goals.length}`);

  console.log("\n🎉 Neon으로 데이터 이전 완료!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
