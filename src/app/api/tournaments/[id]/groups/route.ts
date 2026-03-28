import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: tournamentId } = await params;
  const { name, label, color, teamIds } = await req.json();

  const group = await prisma.group.create({
    data: {
      name,
      label: label || null,
      color: color || "#6366f1",
      tournamentId,
      teams: {
        create: (teamIds as string[]).map((teamId) => ({ teamId })),
      },
    },
    include: { teams: { include: { team: true } } },
  });
  return NextResponse.json(group, { status: 201 });
}
