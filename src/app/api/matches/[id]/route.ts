import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { recalcGroupStandings } from "@/lib/standings";

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
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(match);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const match = await prisma.match.update({
    where: { id },
    data: {
      ...(body.homeScore !== undefined && { homeScore: body.homeScore !== null ? Number(body.homeScore) : null }),
      ...(body.awayScore !== undefined && { awayScore: body.awayScore !== null ? Number(body.awayScore) : null }),
      ...(body.status && { status: body.status }),
      ...(body.date !== undefined && { date: body.date ? new Date(body.date) : null }),
      ...(body.venue !== undefined && { venue: body.venue }),
      ...(body.court !== undefined && { court: body.court }),
      ...(body.round !== undefined && { round: body.round }),
    },
  });

  // recalc group standings if match belongs to a group
  if (match.groupId && match.status === "FINISHED") {
    await recalcGroupStandings(match.groupId);
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
