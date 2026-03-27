import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: teamId } = await params;
  const { name, number, position } = await req.json();
  if (!name) return NextResponse.json({ error: "선수 이름 필수" }, { status: 400 });

  const player = await prisma.player.create({
    data: { name, number: number ? Number(number) : null, position, teamId },
  });
  return NextResponse.json(player, { status: 201 });
}
