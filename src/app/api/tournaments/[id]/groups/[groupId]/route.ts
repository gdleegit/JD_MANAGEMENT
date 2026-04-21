import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type Params = { params: Promise<{ id: string; groupId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id, groupId } = await params;
  const { name, label, color, sortOrder } = await req.json();

  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...(name !== undefined && { name }),
      ...(label !== undefined && { label: label || null }),
      ...(color !== undefined && { color }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
    },
    include: { teams: { include: { team: true } } },
  });
  revalidatePath(`/tournaments/${id}`);
  return NextResponse.json(group);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id, groupId } = await params;
  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath(`/tournaments/${id}`);
  return NextResponse.json({ ok: true });
}
