import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalcLeagueStandings } from "@/lib/standings";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (tournament.type === "LEAGUE") {
    const standings = await recalcLeagueStandings(id);
    // attach team info
    const teams = await prisma.team.findMany({
      where: { id: { in: standings.map((s) => s.teamId) } },
    });
    const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));
    return NextResponse.json(standings.map((s) => ({ ...s, team: teamMap[s.teamId] })));
  }

  return NextResponse.json([]);
}
