import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const [tournaments, teams] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { teams: true, matches: true } } },
    }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { players: true } } },
    }),
  ]);

  return <AdminDashboard tournaments={tournaments} teams={teams} username={session.username} />;
}
