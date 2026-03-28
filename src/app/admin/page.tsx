import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // 데이터는 클라이언트에서 fetch — 페이지 HTML은 즉시 반환
  return <AdminDashboard username={session.username} />;
}
