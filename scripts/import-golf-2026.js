/**
 * 2026 골프대회 조편성 엑셀 임포트 스크립트
 * 실행: node scripts/import-golf-2026.js
 */

const { PrismaClient } = require("@prisma/client");
const XLSX = require("xlsx");

const prisma = new PrismaClient();

const TOURNAMENT_ID = "cmp6kurau0000gm8g5mhcylh3";
const GOLF_ROUND_ID = "cmp6mkwtx000114dya3mfmuj9";
const EXCEL_PATH = "public/2026골프대회 조편성.xlsx";

// 기수 번호 → 팀명 파싱
function parsePlayer(raw) {
  if (!raw) return null;
  const str = String(raw).trim();
  const match = str.match(/^(\d+)(.+)$/);
  if (!match) return { number: null, name: str };
  return { number: parseInt(match[1]), name: match[2].trim() };
}

// 코스 → 그룹명 매핑
const COURSE_GROUP = {
  "마운틴, 밸리": { name: "마운틴 · 밸리", color: "#16a34a" },
  "밸리, 레이크": { name: "밸리 · 레이크", color: "#2563eb" },
  "레이크, 마운틴": { name: "레이크 · 마운틴", color: "#7c3aed" },
};

async function main() {
  console.log("📂 엑셀 파일 읽는 중...");
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }).slice(1);
  console.log(`   → ${rows.length}개 조 발견`);

  // 1. 코스별 그룹 생성
  console.log("\n📋 코스별 그룹(리그) 생성 중...");
  const courseGroupMap = {}; // courseName → Group
  const uniqueCourses = [...new Set(rows.map((r) => r[6]).filter(Boolean))];

  for (const course of uniqueCourses) {
    const info = COURSE_GROUP[course] || { name: course, color: "#6366f1" };
    const existing = await prisma.group.findFirst({
      where: { tournamentId: TOURNAMENT_ID, name: info.name },
    });
    if (existing) {
      courseGroupMap[course] = existing;
      console.log(`   ✅ 기존: ${info.name}`);
    } else {
      const group = await prisma.group.create({
        data: {
          name: info.name,
          label: info.name,
          color: info.color,
          tournamentId: TOURNAMENT_ID,
          sortOrder: Object.keys(courseGroupMap).length,
        },
      });
      courseGroupMap[course] = group;
      console.log(`   ➕ 생성: ${info.name}`);
    }
  }

  // 2. 조별 팀 생성 + 선수 추가
  console.log("\n👥 조 팀 생성 및 선수 등록 중...");
  let teamCount = 0;
  let playerCount = 0;

  for (const row of rows) {
    const [groupNum, p1, p2, p3, p4, leagueName, course] = row;
    if (!groupNum) continue;

    const teamName = `${groupNum}조`;
    const shortName = leagueName || null; // VIP조, 챔피언조 등

    // 팀 생성 (중복 방지)
    let team = await prisma.team.findFirst({ where: { name: teamName } });
    if (!team) {
      team = await prisma.team.create({
        data: {
          name: teamName,
          shortName,
          color: "#6b7280",
        },
      });
      teamCount++;
    }

    // 대회에 팀 추가 (중복 방지)
    const existingTT = await prisma.tournamentTeam.findUnique({
      where: { tournamentId_teamId: { tournamentId: TOURNAMENT_ID, teamId: team.id } },
    });
    if (!existingTT) {
      await prisma.tournamentTeam.create({
        data: { tournamentId: TOURNAMENT_ID, teamId: team.id },
      });
    }

    // 코스 그룹에 팀 배정 (중복 방지)
    if (course && courseGroupMap[course]) {
      const group = courseGroupMap[course];
      const existingGT = await prisma.groupTeam.findUnique({
        where: { groupId_teamId: { groupId: group.id, teamId: team.id } },
      });
      if (!existingGT) {
        await prisma.groupTeam.create({
          data: { groupId: group.id, teamId: team.id },
        });
      }
    }

    // 선수 등록
    const playerRaws = [p1, p2, p3, p4].filter(Boolean);
    for (const raw of playerRaws) {
      const parsed = parsePlayer(raw);
      if (!parsed) continue;

      // 중복 방지: 같은 팀에 같은 이름 선수
      const existingPlayer = await prisma.player.findFirst({
        where: { teamId: team.id, name: parsed.name },
      });
      if (existingPlayer) continue;

      const player = await prisma.player.create({
        data: {
          name: parsed.name,
          number: parsed.number,
          sport: "GOLF",
          teamId: team.id,
        },
      });
      playerCount++;

      // GolfScore 초기 레코드 (strokes null)
      const existingScore = await prisma.golfScore.findUnique({
        where: { roundId_playerId: { roundId: GOLF_ROUND_ID, playerId: player.id } },
      });
      if (!existingScore) {
        await prisma.golfScore.create({
          data: { roundId: GOLF_ROUND_ID, playerId: player.id, teamId: team.id },
        });
      }
    }

    console.log(`   ✅ ${teamName}${shortName ? ` (${shortName})` : ""} — ${playerRaws.length}명 | ${course ?? "-"}`);
  }

  console.log(`\n✅ 완료!`);
  console.log(`   팀 생성: ${teamCount}개`);
  console.log(`   선수 등록: ${playerCount}명`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
