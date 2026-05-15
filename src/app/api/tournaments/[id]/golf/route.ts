import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const round = await prisma.golfRound.findUnique({
    where: { tournamentId: id },
    include: { scores: true },
  });
  return NextResponse.json(round);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id } = await params;
  const { venue, scores } = await req.json() as {
    venue?: string;
    scores?: { playerId: string; teamId: string; strokes: number | null }[];
  };

  const round = await prisma.golfRound.upsert({
    where: { tournamentId: id },
    create: { tournamentId: id, venue: venue || null },
    update: { venue: venue || null },
  });

  if (Array.isArray(scores)) {
    await Promise.all(
      scores.map((s) =>
        prisma.golfScore.upsert({
          where: { roundId_playerId: { roundId: round.id, playerId: s.playerId } },
          create: { roundId: round.id, playerId: s.playerId, teamId: s.teamId, strokes: s.strokes ?? null },
          update: { strokes: s.strokes ?? null },
        })
      )
    );
  }

  revalidatePath(`/tournaments/${id}`);
  revalidatePath("/tournaments");
  return NextResponse.json(round);
}
