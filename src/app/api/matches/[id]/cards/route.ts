import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: matchId } = await params;
  const { teamId, playerId, minute, half, type } = await req.json();

  const card = await prisma.card.create({
    data: {
      matchId,
      teamId,
      playerId: playerId || null,
      minute: minute ? Number(minute) : null,
      half: half ? Number(half) : null,
      type,
    },
    include: { player: true, team: true },
  });

  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { tournamentId: true } });
  if (match) {
    revalidatePath(`/tournaments/${match.tournamentId}`);
  }

  return NextResponse.json({ card }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: matchId } = await params;
  const { cardId } = await req.json();

  await prisma.card.delete({ where: { id: cardId } });

  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { tournamentId: true } });
  if (match) {
    revalidatePath(`/tournaments/${match.tournamentId}`);
  }

  return NextResponse.json({ ok: true });
}
