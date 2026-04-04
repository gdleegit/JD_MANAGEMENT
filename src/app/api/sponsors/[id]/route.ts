import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id } = await params;
  const { name, type, logoUrl, link, order } = await req.json();

  const sponsor = await prisma.sponsor.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      ...(link !== undefined && { link: link || null }),
      ...(order !== undefined && { order }),
    },
  });

  revalidatePath(`/tournaments/${sponsor.tournamentId}`);
  return NextResponse.json(sponsor);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id } = await params;
  const sponsor = await prisma.sponsor.delete({ where: { id } });
  revalidatePath(`/tournaments/${sponsor.tournamentId}`);
  return NextResponse.json({ ok: true });
}
