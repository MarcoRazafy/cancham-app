import { CalendarClock } from "lucide-react";
import { CarteRendezvous } from "@/components/rendezvous/CarteRendezvous";
import { Reservation } from "@/components/rendezvous/Reservation";
import { EmptyState, SectionTitle, ViewHead } from "@/components/ui";
import { estHeure, estJourISO } from "@/lib/agenda";
import { aujourdhuiISO } from "@/lib/format";
import { MENTION_FUSEAU } from "@/lib/rendezvous";
import {
  getCreneaux,
  getMesRendezvous,
  getTypesRendezvous,
} from "@/lib/rendezvous-donnees";
import { getCurrentUser } from "@/lib/session";

/**
 * Rendez-vous d'un membre avec l'équipe de la chambre.
 *
 * Ses rendez-vous à venir d'abord — c'est ce qu'on vient vérifier le plus
 * souvent — puis la prise de rendez-vous, qui ne montre que des créneaux
 * réellement libres.
 */
export default async function RendezvousPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; jour?: string; h?: string }>;
}) {
  const p = await searchParams;
  const user = await getCurrentUser("membre");

  const [types, mes] = await Promise.all([
    getTypesRendezvous(),
    getMesRendezvous(user.id),
  ]);

  const type = types.find((t) => t.id === p.type) ?? null;
  const jours = type ? await getCreneaux(type.duree) : [];
  const jour =
    estJourISO(p.jour) && jours.some((j) => j.jour === p.jour) ? p.jour : null;
  const heure = estHeure(p.h) ? p.h : null;

  return (
    <>
      <ViewHead title="Rendez-vous">
        Réservez un créneau avec l’équipe de la chambre : elle reçoit la demande
        confirmée, sans échange de courriels pour trouver une heure. Toutes les
        heures sont à l’{MENTION_FUSEAU}.
      </ViewHead>

      <SectionTitle>Vos rendez-vous à venir</SectionTitle>
      <div className="mb-7">
        {mes.length ? (
          <div className="flex flex-col gap-2.5">
            {mes.map((rdv) => (
              <CarteRendezvous
                key={rdv.id}
                rdv={rdv}
                aujourdhui={aujourdhuiISO()}
                retour="/membre/rendez-vous"
                cote="membre"
              />
            ))}
          </div>
        ) : (
          <EmptyState>
            <CalendarClock size={22} className="mx-auto mb-2 text-faint" />
            Aucun rendez-vous prévu. Choisissez un créneau ci-dessous.
          </EmptyState>
        )}
      </div>

      <SectionTitle>Prendre un rendez-vous</SectionTitle>
      <Reservation
        types={types}
        type={type}
        jours={jours}
        jour={jour}
        heure={heure}
      />
    </>
  );
}
