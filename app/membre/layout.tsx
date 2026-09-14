import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { getMember, getUnreadTotal } from "@/lib/queries";
import { getNotifications } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";
import { isAccessLocked } from "@/lib/membership";
import { NAV_MEMBRE } from "@/lib/nav";

export default async function MembreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser("membre");
  const member = user.memberId ? await getMember(user.memberId) : null;
  if (!member) notFound();

  const [unread, notifications] = await Promise.all([
    getUnreadTotal(),
    getNotifications("membre", member.id),
  ]);
  const locked = isAccessLocked(member);

  return (
    <Shell
      space="membre"
      user={user}
      nav={NAV_MEMBRE}
      badges={{ "/membre/messagerie": unread }}
      notifications={notifications}
      lockedHrefs={
        locked
          ? NAV_MEMBRE.flatMap((g) => g.items)
              .map((i) => i.href)
              .filter((h) => h !== "/membre/profil")
          : []
      }
    >
      {children}
    </Shell>
  );
}
