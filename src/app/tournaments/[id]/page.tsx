import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { recalcLeagueStandings } from "@/lib/standings";
import TournamentPublicView from "@/components/TournamentPublicView";

export const revalidate = 60;

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      teams: { include: { team: { include: { players: true } } } },
      matches: {
        include: {
          homeTeam: true,
          awayTeam: true,
          goals: { include: { player: true, team: true }, orderBy: { minute: "asc" } },
          group: true,
        },
        orderBy: [{ date: "asc" }, { matchOrder: "asc" }],
      },
      groups: {
        include: {
          teams: {
            include: { team: true },
            orderBy: [{ points: "desc" }, { gf: "desc" }],
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!tournament) notFound();

  let leagueStandings: Array<{
    teamId: string;
    team?: { name: string; color?: string | null };
    played: number; won: number; drawn: number; lost: number;
    gf: number; ga: number; gd: number; points: number;
  }> = [];

  if (tournament.type === "LEAGUE") {
    const raw = await recalcLeagueStandings(id);
    const teams = await prisma.team.findMany({ where: { id: { in: raw.map((r) => r.teamId) } } });
    const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));
    leagueStandings = raw.map((r) => ({ ...r, team: teamMap[r.teamId] }));
  }

  // Serialize Dates to strings for client component
  const serialized = JSON.parse(JSON.stringify(tournament));

  return (
    <TournamentPublicView
      tournament={serialized}
      leagueStandings={leagueStandings}
    />
  );
}
