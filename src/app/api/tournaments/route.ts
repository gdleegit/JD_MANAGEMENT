import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { teams: true, matches: true } } },
  });
  return NextResponse.json(tournaments);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const body = await req.json();
  const { name, type, startDate, endDate, description } = body;
  if (!name || !type) return NextResponse.json({ error: "이름과 유형은 필수입니다" }, { status: 400 });

  const tournament = await prisma.tournament.create({
    data: {
      name,
      type,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      description,
    },
  });
  return NextResponse.json(tournament, { status: 201 });
}
