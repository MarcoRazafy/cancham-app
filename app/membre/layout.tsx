import { notFound } from "next/navigation";
import { PAGES_TOUJOURS_OUVERTES } from "@/lib/membership";
import { Coquille } from "@/components/membre/Coquille";
import { BulleSupport } from "@/components/support/BulleSupport";
import { getMember, getStatsPubliques, getUnreadTotal } from "@/lib/queries";
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
  const membre = user.memberId ? await getMember(user.memberId) : null;
  if (!membre) notFound();

  const [unread, stats, notifications] = await Promise.all([
    getUnreadTotal(user.id),
    getStatsPubliques(),
    getNotifications("membre", membre.id, user.id),
  ]);

  const verrouille = isAccessLocked(membre);

  // Le profil et les cotisations restent accessibles : c'est là que le membre
  // régularise sa situation.
  const toujoursOuvert = PAGES_TOUJOURS_OUVERTES;

  return (
    <Coquille
      user={user}
      membre={membre}
      nav={NAV_MEMBRE}
      badges={{
        "/membre/evenements": stats.evenementsAVenir,
        "/membre/messagerie": unread,
      }}
      notifications={notifications}
      lockedHrefs={
        verrouille
          ? NAV_MEMBRE.flatMap((g) => g.items)
              .map((i) => i.href)
              .filter((h) => !toujoursOuvert.includes(h))
          : []
      }
    >
      {children}
      {/* Le support flotte au-dessus de chaque page, accès restreint compris :
          c'est justement là qu'on a besoin de joindre l'équipe. */}
      <BulleSupport espace="membre" prenom={user.nom.split(" ")[0]} />
    </Coquille>
  );
}
