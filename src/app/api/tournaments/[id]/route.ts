import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      teams: { include: { team: { include: { players: true } } } },
      matches: {
        include: {
          homeTeam: { include: { players: true } },
          awayTeam: { include: { players: true } },
          goals: { include: { player: true, team: true } },
          group: true,
        },
        orderBy: [{ matchOrder: "asc" }, { date: "asc" }],
      },
      groups: { include: { teams: { include: { team: true } } } },
    },
  });
  if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tournament);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, type, status, startDate, endDate, description, rules } = body;

  const tournament = await prisma.tournament.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(type && { type }),
      ...(status && { status }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(description !== undefined && { description }),
      ...(rules !== undefined && { rules }),
    },
  });
  revalidatePath(`/tournaments/${id}`);
  revalidatePath("/tournaments");
  revalidatePath("/");
  return NextResponse.json(tournament);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id } = await params;
  await prisma.tournament.delete({ where: { id } });
  revalidatePath("/tournaments");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
