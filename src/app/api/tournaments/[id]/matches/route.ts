import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: tournamentId } = await params;
  const body = await req.json();
  const { homeTeamId, awayTeamId, date, venue, court, round, stage, groupId, matchOrder } = body;

  if (!homeTeamId || !awayTeamId) return NextResponse.json({ error: "팀 정보 필요" }, { status: 400 });
  if (homeTeamId === awayTeamId) return NextResponse.json({ error: "홈팀과 어웨이팀이 같습니다" }, { status: 400 });

  const match = await prisma.match.create({
    data: {
      tournamentId,
      homeTeamId,
      awayTeamId,
      date: date ? new Date(date) : null,
      venue,
      court: court || null,
      round,
      stage,
      groupId: groupId || null,
      matchOrder: matchOrder ?? null,
    },
    include: { homeTeam: true, awayTeam: true },
  });
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  return NextResponse.json(match, { status: 201 });
}
