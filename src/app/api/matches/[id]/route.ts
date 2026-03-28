import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { recalcGroupStandings } from "@/lib/standings";
import { revalidatePath } from "next/cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { include: { players: true } },
      awayTeam: { include: { players: true } },
      goals: { include: { player: true, team: true }, orderBy: { minute: "asc" } },
    },
  });
  if (!match) return NextResponse.json({ error: "경기를 찾을 수 없습니다" }, { status: 404 });
  return NextResponse.json(match);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const homeScore = body.homeScore !== undefined ? (body.homeScore !== null ? Number(body.homeScore) : null) : undefined;
  const awayScore = body.awayScore !== undefined ? (body.awayScore !== null ? Number(body.awayScore) : null) : undefined;
  // 예정(SCHEDULED) 명시 시 유지, 그 외 양쪽 스코어 모두 있으면 자동 FINISHED
  const autoStatus = (homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined && body.status !== "SCHEDULED")
    ? "FINISHED"
    : body.status || undefined;

  const match = await prisma.match.update({
    where: { id },
    data: {
      ...(homeScore !== undefined && { homeScore }),
      ...(awayScore !== undefined && { awayScore }),
      ...(autoStatus && { status: autoStatus }),
      ...(body.date !== undefined && { date: body.date ? new Date(body.date) : null }),
      ...(body.venue !== undefined && { venue: body.venue }),
      ...(body.court !== undefined && { court: body.court }),
      ...(body.round !== undefined && { round: body.round }),
      ...(body.matchOrder !== undefined && { matchOrder: body.matchOrder !== null ? Number(body.matchOrder) : null }),
      ...(body.referee !== undefined && { referee: body.referee }),
      ...(body.assistantReferee1 !== undefined && { assistantReferee1: body.assistantReferee1 }),
      ...(body.assistantReferee2 !== undefined && { assistantReferee2: body.assistantReferee2 }),
    },
  });

  // GROUP: 스코어 또는 상태 변경 시에만 재계산
  const scoreOrStatusChanged = homeScore !== undefined || awayScore !== undefined || autoStatus !== undefined;
  if (match.groupId && scoreOrStatusChanged) {
    await recalcGroupStandings(match.groupId);
  }

  if (scoreOrStatusChanged) {
    revalidatePath(`/tournaments/${match.tournamentId}`);
    revalidatePath("/tournaments");
  }

  return NextResponse.json(match);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id } = await params;
  await prisma.match.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
