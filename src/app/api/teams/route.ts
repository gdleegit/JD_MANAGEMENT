import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { players: true } } },
  });
  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { name, shortName, color } = await req.json();
  if (!name) return NextResponse.json({ error: "팀 이름 필수" }, { status: 400 });

  const team = await prisma.team.create({ data: { name, shortName, color } });
  return NextResponse.json(team, { status: 201 });
}
