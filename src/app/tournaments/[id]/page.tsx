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
      // 선수 데이터는 제외 — 참가팀 탭에서 lazy load
      teams: { include: { team: true } },
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
        orderBy: { sortOrder: "asc" },
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
    const teamMap = Object.fromEntries(tournament.teams.map((tt) => [tt.team.id, tt.team]));
    leagueStandings = raw.map((r) => ({ ...r, team: teamMap[r.teamId] }));
  }

  const serialized = JSON.parse(JSON.stringify(tournament));

  return (
    <TournamentPublicView
      tournament={serialized}
      leagueStandings={leagueStandings}
    />
  );
}
