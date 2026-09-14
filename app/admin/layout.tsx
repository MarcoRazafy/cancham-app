import { Shell } from "@/components/Shell";
import { getMemberStats, getUnreadTotal } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { NAV_ADMIN } from "@/lib/nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, stats, unread] = await Promise.all([
    getCurrentUser("admin"),
    getMemberStats(),
    getUnreadTotal(),
  ]);

  // Ce qui demande une action de l'équipe : tout ce qui n'est pas à jour.
  const aTraiter = stats.total - stats.aJour;

  return (
    <Shell
      space="admin"
      user={user}
      nav={NAV_ADMIN}
      badges={{ "/admin/membres": aTraiter, "/admin/messagerie": unread }}
    >
      {children}
    </Shell>
  );
}
