import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: teamId } = await params;
  const body = await req.json();

  // 일괄 추가: { players: [...] }
  if (Array.isArray(body.players)) {
    const valid = body.players.filter((p: { name?: string }) => p.name?.trim());
    if (!valid.length) return NextResponse.json({ error: "선수 이름 필수" }, { status: 400 });
    const created = await prisma.player.createManyAndReturn({
      data: valid.map((p: { name: string; number?: string; position?: string }) => ({
        name: p.name.trim(),
        number: p.number ? Number(p.number) : null,
        position: p.position || null,
        teamId,
      })),
    });
    return NextResponse.json(created, { status: 201 });
  }

  // 단일 추가
  const { name, number, position } = body;
  if (!name) return NextResponse.json({ error: "선수 이름 필수" }, { status: 400 });
  const player = await prisma.player.create({
    data: { name, number: number ? Number(number) : null, position: position || null, teamId },
  });
  return NextResponse.json(player, { status: 201 });
}
