import { Shell } from "@/components/Shell";
import { getMemberStats, getUnreadTotal } from "@/lib/queries";
import { getNotifications } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";
import { NAV_ADMIN } from "@/lib/nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, stats, unread, notifications] = await Promise.all([
    getCurrentUser("admin"),
    getMemberStats(),
    getUnreadTotal(),
    getNotifications("admin", null),
  ]);

  // Ce qui demande une action de l'équipe : tout ce qui n'est pas à jour.
  const aTraiter = stats.total - stats.aJour;

  return (
    <Shell
      space="admin"
      user={user}
      nav={NAV_ADMIN}
      badges={{ "/admin/membres": aTraiter, "/admin/messagerie": unread }}
      notifications={notifications}
    >
      {children}
    </Shell>
  );
}
