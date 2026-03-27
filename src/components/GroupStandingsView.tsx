"use client";

type Team = { id: string; name: string; color?: string | null };
type GroupTeam = { id: string; team: Team; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number };
type Group = { id: string; name: string; teams: GroupTeam[] };

export default function GroupStandingsView({ groups }: { groups: Group[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">조별 순위</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group) => (
          <div key={group.id} className="card p-4">
            <h3 className="font-bold text-lg mb-3">{group.name}조</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs">
                    <th className="text-left pb-2 font-medium">팀</th>
                    <th className="text-center pb-2 font-medium px-1">경</th>
                    <th className="text-center pb-2 font-medium px-1">승</th>
                    <th className="text-center pb-2 font-medium px-1">무</th>
                    <th className="text-center pb-2 font-medium px-1">패</th>
                    <th className="text-center pb-2 font-medium px-1">득실</th>
                    <th className="text-center pb-2 font-bold px-1">승점</th>
                  </tr>
                </thead>
                <tbody>
                  {[...group.teams]
                    .sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga))
                    .map((gt, i) => (
                      <tr key={gt.id} className="border-t border-gray-100">
                        <td className="py-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs">{i + 1}</span>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gt.team.color || "#3b82f6" }} />
                            <span className="font-medium">{gt.team.name}</span>
                          </div>
                        </td>
                        <td className="text-center px-1">{gt.played}</td>
                        <td className="text-center px-1">{gt.won}</td>
                        <td className="text-center px-1">{gt.drawn}</td>
                        <td className="text-center px-1">{gt.lost}</td>
                        <td className="text-center px-1 text-gray-500">{gt.gf - gt.ga > 0 ? `+${gt.gf - gt.ga}` : gt.gf - gt.ga}</td>
                        <td className="text-center px-1 font-bold text-blue-600">{gt.points}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
