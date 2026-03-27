import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Add team to tournament
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: tournamentId } = await params;
  const { teamId, seed } = await req.json();

  const entry = await prisma.tournamentTeam.create({
    data: { tournamentId, teamId, seed },
    include: { team: true },
  });
  return NextResponse.json(entry, { status: 201 });
}

// Remove team from tournament
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: tournamentId } = await params;
  const { teamId } = await req.json();

  await prisma.tournamentTeam.deleteMany({ where: { tournamentId, teamId } });
  return NextResponse.json({ ok: true });
}
