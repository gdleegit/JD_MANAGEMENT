import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// 참가팀 + 선수 목록 조회 (public, lazy load용)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params;
  const entries = await prisma.tournamentTeam.findMany({
    where: { tournamentId },
    include: { team: { include: { players: { orderBy: [{ number: "asc" }, { name: "asc" }] } } } },
  });
  return NextResponse.json(entries, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  });
}

// Add team to tournament
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: tournamentId } = await params;
  const { teamId, seed } = await req.json();

  try {
    const entry = await prisma.tournamentTeam.create({
      data: { tournamentId, teamId, seed },
      include: { team: true },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "이미 참가 중인 팀입니다" }, { status: 409 });
    }
    throw e;
  }
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
