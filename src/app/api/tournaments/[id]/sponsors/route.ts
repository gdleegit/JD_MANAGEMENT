import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sponsors = await prisma.sponsor.findMany({
    where: { tournamentId: id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(sponsors);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { id: tournamentId } = await params;
  const { name, grade, type, logoUrl, link, description, order } = await req.json();
  if (!name) return NextResponse.json({ error: "이름 필요" }, { status: 400 });

  const sponsor = await prisma.sponsor.create({
    data: {
      tournamentId,
      name,
      grade: grade || null,
      type: type || "SPONSOR",
      logoUrl: logoUrl || null,
      link: link || null,
      description: description || null,
      order: order ?? 0,
    },
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return NextResponse.json(sponsor, { status: 201 });
}
