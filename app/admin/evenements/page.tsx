import { Users } from "lucide-react";
import { EventCard } from "@/components/domain";
import {
  BtnLink,
  EmptyState,
  Saillant,
  SectionTitle,
  ViewHead,
} from "@/components/ui";
import {
  DeleteEventButton,
  EventFormButton,
} from "@/components/forms/EventForms";
import { getEvents } from "@/lib/queries";
import { isPast } from "@/lib/format";

export default async function AdminEvenements() {
  const events = await getEvents();
  const upcoming = events.filter((e) => !isPast(e.date));
  const past = events
    .filter((e) => isPast(e.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  const controls = (e: (typeof events)[number]) => (
    <>
      <EventFormButton event={e} />
      <BtnLink href={`/admin/evenements/${e.id}/inscrits`} sm>
        <Users size={13} /> Inscrits ({e.inscrits})
      </BtnLink>
      <DeleteEventButton eventId={e.id} titre={e.titre} />
    </>
  );

  return (
    <>
      <ViewHead
        title={<>Gestion des {<Saillant>événements</Saillant>}</>}
        action={<EventFormButton />}
      >
        Créez un événement, suivez les inscriptions et préparez l’enregistrement
        par QR le jour J. Même présentation que côté membre, avec les options de
        modification en plus.
      </ViewHead>

      <SectionTitle>À venir</SectionTitle>
      <div className="grid gap-4 mb-7 md:grid-cols-2">
        {upcoming.length ? (
          upcoming.map((e) => (
            <EventCard key={e.id} event={e} footer={controls(e)} />
          ))
        ) : (
          <EmptyState>Aucun événement à venir.</EmptyState>
        )}
      </div>

      <SectionTitle>Passés</SectionTitle>
      <div className="grid gap-4 md:grid-cols-2">
        {past.length ? (
          past.map((e) => (
            <EventCard key={e.id} event={e} footer={controls(e)} />
          ))
        ) : (
          <EmptyState>Aucun événement passé.</EmptyState>
        )}
      </div>
    </>
  );
}
