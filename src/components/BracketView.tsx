"use client";

type Goal = { id: string; type: string; teamId: string; player?: { name: string } | null; minute?: number | null };
type Team = { id: string; name: string; color?: string | null };
type Match = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  round?: string | null;
  status: string;
  goals: Goal[];
};

export default function BracketView({ matches }: { matches: Match[] }) {
  // Group by round
  const rounds: Record<string, Match[]> = {};
  for (const m of matches) {
    const r = m.round || "미정";
    if (!rounds[r]) rounds[r] = [];
    rounds[r].push(m);
  }

  const roundOrder = ["32강", "16강", "8강", "4강", "3위", "준결승", "결승", "FINAL", "SEMI", "QUARTER", "ROUND_OF_16"];
  const sortedRounds = Object.keys(rounds).sort((a, b) => {
    const ai = roundOrder.indexOf(a);
    const bi = roundOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  if (sortedRounds.length === 0) {
    return <p className="text-gray-400 text-center py-6">등록된 경기가 없습니다</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max pb-4">
        {sortedRounds.map((round) => (
          <div key={round} className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-center text-gray-600 bg-gray-100 px-4 py-1.5 rounded-full">{round}</h3>
            <div className="flex flex-col gap-3">
              {rounds[round].map((match) => (
                <BracketMatch key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketMatch({ match }: { match: Match }) {
  const finished = match.status === "FINISHED";
  const homeWin = finished && match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore;
  const awayWin = finished && match.homeScore != null && match.awayScore != null && match.awayScore > match.homeScore;

  return (
    <div className="w-56 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <TeamRow
        team={match.homeTeam}
        score={match.homeScore}
        finished={finished}
        winner={homeWin}
      />
      <div className="border-t border-gray-200" />
      <TeamRow
        team={match.awayTeam}
        score={match.awayScore}
        finished={finished}
        winner={awayWin}
      />
    </div>
  );
}

function TeamRow({ team, score, finished, winner }: { team: Team; score?: number | null; finished: boolean; winner: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 ${winner ? "bg-blue-50" : "bg-white"}`}>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color || "#3b82f6" }} />
        <span className={`text-sm ${winner ? "font-bold text-blue-700" : "text-gray-700"}`}>{team.name}</span>
      </div>
      <span className={`text-sm font-bold ml-2 ${winner ? "text-blue-700" : finished ? "text-gray-700" : "text-gray-300"}`}>
        {finished ? (score ?? "-") : "-"}
      </span>
    </div>
  );
}
