import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { getMember, getUnreadTotal } from "@/lib/queries";
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

  const [unread] = await Promise.all([getUnreadTotal()]);
  const locked = isAccessLocked(member);

  return (
    <Shell
      space="membre"
      user={user}
      nav={NAV_MEMBRE}
      badges={{ "/membre/messagerie": unread }}
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
