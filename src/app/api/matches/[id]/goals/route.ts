import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { recalcGroupStandings } from "@/lib/standings";

async function recalcMatchScore(matchId: string) {
  const goals = await prisma.goal.findMany({ where: { matchId } });
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return match;

  const homeScore = goals.filter((g) => g.teamId === match.homeTeamId && g.type !== "OWN_GOAL").length
    + goals.filter((g) => g.teamId === match.awayTeamId && g.type === "OWN_GOAL").length;
  const awayScore = goals.filter((g) => g.teamId === match.awayTeamId && g.type !== "OWN_GOAL").length
    + goals.filter((g) => g.teamId === match.homeTeamId && g.type === "OWN_GOAL").length;

  const updated = await prisma.match.update({ where: { id: matchId }, data: { homeScore, awayScore } });

  if (updated.groupId && updated.status === "FINISHED") {
    await recalcGroupStandings(updated.groupId);
  }
  return updated;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: matchId } = await params;
  const { playerId, teamId, minute, type } = await req.json();
  if (!teamId) return NextResponse.json({ error: "팀 정보 필요" }, { status: 400 });

  const goal = await prisma.goal.create({
    data: {
      matchId,
      playerId: playerId || null,
      teamId,
      minute: minute ? Number(minute) : null,
      type: type || "GOAL",
    },
    include: { player: true, team: true },
  });

  await recalcMatchScore(matchId);
  return NextResponse.json(goal, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: matchId } = await params;
  const { goalId } = await req.json();

  await prisma.goal.delete({ where: { id: goalId } });
  await recalcMatchScore(matchId);
  return NextResponse.json({ ok: true });
}
