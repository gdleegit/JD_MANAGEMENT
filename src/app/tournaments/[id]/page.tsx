import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { recalcLeagueStandings } from "@/lib/standings";
import TournamentPublicView from "@/components/TournamentPublicView";

export const revalidate = 60;

// 빌드 시 모든 대회 페이지를 미리 렌더링 → CDN 서빙, 첫 로드 즉시 응답
export async function generateStaticParams() {
  const tournaments = await prisma.tournament.findMany({ select: { id: true } });
  return tournaments.map((t) => ({ id: t.id }));
}

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      teams: { include: { team: { include: { _count: { select: { players: true } } } } } },
      matches: {
        include: {
          homeTeam: true,
          awayTeam: true,
          goals: { include: { player: true, team: true }, orderBy: { minute: "asc" } },
          cards: { include: { player: true, team: true }, orderBy: { minute: "asc" } },
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
        orderBy: { sortOrder: "asc" },
      },
      sponsors: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
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
    const teamMap = Object.fromEntries(tournament.teams.map((tt) => [tt.team.id, tt.team]));
    leagueStandings = raw.map((r) => ({ ...r, team: teamMap[r.teamId] }));
  }

  const playerCount = tournament.teams.reduce((sum, tt) => sum + (tt.team as typeof tt.team & { _count: { players: number } })._count.players, 0);
  const serialized = JSON.parse(JSON.stringify(tournament));

  return (
    <TournamentPublicView
      tournament={serialized}
      leagueStandings={leagueStandings}
      playerCount={playerCount}
    />
  );
}
