import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// POST: 팀을 해당 그룹에 배정 (동일 대회의 다른 그룹에서 자동 제거)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; groupId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: tournamentId, groupId } = await params;
  const { teamId } = await req.json() as { teamId: string };

  // 동일 대회의 다른 그룹에서 제거
  const allGroups = await prisma.group.findMany({ where: { tournamentId }, select: { id: true } });
  const otherIds = allGroups.map(g => g.id).filter(gid => gid !== groupId);
  if (otherIds.length > 0) {
    await prisma.groupTeam.deleteMany({ where: { groupId: { in: otherIds }, teamId } });
  }

  // 해당 그룹에 추가 (이미 있으면 무시)
  const groupTeam = await prisma.groupTeam.upsert({
    where: { groupId_teamId: { groupId, teamId } },
    create: { groupId, teamId },
    update: {},
    include: { team: true },
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  return NextResponse.json(groupTeam);
}

// DELETE: 팀을 해당 그룹에서 제거
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; groupId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: tournamentId, groupId } = await params;
  const { teamId } = await req.json() as { teamId: string };

  await prisma.groupTeam.deleteMany({ where: { groupId, teamId } });

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  return NextResponse.json({ ok: true });
}
