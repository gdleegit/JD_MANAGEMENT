import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string; groupId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { groupId } = await params;
  const { name, label, color } = await req.json();

  // color 필드는 prisma generate 미완료 시 타입 오류 우회용 raw 처리
  if (color !== undefined) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Group" SET color = ? WHERE id = ?`,
      color,
      groupId
    );
  }

  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...(name !== undefined && { name }),
      ...(label !== undefined && { label: label || null }),
    },
    include: { teams: { include: { team: true } } },
  });
  return NextResponse.json(group);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { groupId } = await params;
  await prisma.group.delete({ where: { id: groupId } });
  return NextResponse.json({ ok: true });
}
