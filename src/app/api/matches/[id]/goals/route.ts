import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { recalcGroupStandings } from "@/lib/standings";
import { revalidatePath } from "next/cache";

async function recalcMatchScore(matchId: string) {
  const [goals, match] = await Promise.all([
    prisma.goal.findMany({ where: { matchId } }),
    prisma.match.findUnique({ where: { id: matchId } }),
  ]);
  if (!match) return null;

  const homeScore = goals.filter((g) => g.teamId === match.homeTeamId && g.type !== "OWN_GOAL").length
    + goals.filter((g) => g.teamId === match.awayTeamId && g.type === "OWN_GOAL").length;
  const awayScore = goals.filter((g) => g.teamId === match.awayTeamId && g.type !== "OWN_GOAL").length
    + goals.filter((g) => g.teamId === match.homeTeamId && g.type === "OWN_GOAL").length;

  const updated = await prisma.match.update({ where: { id: matchId }, data: { homeScore, awayScore } });

  if (updated.groupId) {
    await recalcGroupStandings(updated.groupId);
  }
  return updated;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: matchId } = await params;
  const body = await req.json();

  // ── Bulk 모드: { goals: [...] } ──
  if (Array.isArray(body.goals)) {
    if (body.goals.length === 0) {
      const goals = await prisma.goal.findMany({ where: { matchId }, include: { player: true, team: true } });
      const match = await prisma.match.findUnique({ where: { id: matchId } });
      return NextResponse.json({ goals, homeScore: match?.homeScore ?? 0, awayScore: match?.awayScore ?? 0 }, { status: 201 });
    }

    await prisma.goal.createMany({
      data: body.goals.map((g: { teamId: string; playerId?: string | null; minute?: number | null; half?: number | null; type?: string }) => ({
        matchId,
        teamId: g.teamId,
        playerId: g.playerId || null,
        minute: g.minute != null ? Number(g.minute) : null,
        half: g.half != null ? Number(g.half) : null,
        type: g.type || "GOAL",
      })),
    });

    const updated = await recalcMatchScore(matchId);
    if (updated) {
      revalidatePath(`/tournaments/${updated.tournamentId}`);
    }

    const goals = await prisma.goal.findMany({ where: { matchId }, include: { player: true, team: true } });
    return NextResponse.json(
      { goals, homeScore: updated?.homeScore ?? 0, awayScore: updated?.awayScore ?? 0 },
      { status: 201 }
    );
  }

  // ── 단일 모드 (기존) ──
  const { playerId, teamId, minute, half, type } = body;
  if (!teamId) return NextResponse.json({ error: "팀 정보 필요" }, { status: 400 });

  const goal = await prisma.goal.create({
    data: {
      matchId,
      playerId: playerId || null,
      teamId,
      minute: minute ? Number(minute) : null,
      half: half ? Number(half) : null,
      type: type || "GOAL",
    },
    include: { player: true, team: true },
  });

  const updated = await recalcMatchScore(matchId);
  if (updated) {
    revalidatePath(`/tournaments/${updated.tournamentId}`);
  }

  return NextResponse.json(
    { goal, homeScore: updated?.homeScore ?? 0, awayScore: updated?.awayScore ?? 0 },
    { status: 201 }
  );
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: matchId } = await params;
  const { goalId, half, minute } = await req.json();
  if (!goalId) return NextResponse.json({ error: "goalId 필요" }, { status: 400 });

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      half: half != null ? Number(half) : null,
      minute: minute !== "" && minute != null ? Number(minute) : null,
    },
    include: { player: true, team: true },
  });

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (match) revalidatePath(`/tournaments/${match.tournamentId}`);

  return NextResponse.json({ goal });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: matchId } = await params;
  const { goalId } = await req.json();

  await prisma.goal.delete({ where: { id: goalId } });
  const updated = await recalcMatchScore(matchId);
  if (updated) {
    revalidatePath(`/tournaments/${updated.tournamentId}`);
  }

  return NextResponse.json({ homeScore: updated?.homeScore ?? 0, awayScore: updated?.awayScore ?? 0 });
}
