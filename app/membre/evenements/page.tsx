import Link from "next/link";
import { EventCard } from "@/components/domain";
import { EmptyState, ViewHead } from "@/components/ui";
import { getEvents, getRegistrations } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { isPast } from "@/lib/format";

type Tab = "a_venir" | "passes" | "mes";

export default async function EvenementsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab: Tab = rawTab === "passes" || rawTab === "mes" ? rawTab : "a_venir";

  const user = await getCurrentUser("membre");
  const memberId = user.memberId!;
  const [events, inscriptions] = await Promise.all([
    getEvents(),
    getRegistrations(memberId),
  ]);
  const mesIds = inscriptions.map((r) => r.eventId);

  const list =
    tab === "a_venir"
      ? events.filter((e) => !isPast(e.date))
      : tab === "passes"
        ? events.filter((e) => isPast(e.date)).sort((a, b) => b.date.localeCompare(a.date))
        : events.filter((e) => mesIds.includes(e.id));

  const tabs: { key: Tab; label: string }[] = [
    { key: "a_venir", label: "À venir" },
    { key: "passes", label: "Passés" },
    { key: "mes", label: `Mes événements${mesIds.length ? ` (${mesIds.length})` : ""}` },
  ];

  return (
    <>
      <ViewHead title="Événements">
        Inscrivez-vous en quelques clics : confirmation par courriel, rappel automatique
        et code d’accès QR pour l’accueil.
      </ViewHead>

      <div className="flex gap-1 border-b border-line mb-[18px]">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/membre/evenements?tab=${t.key}`}
            className={`px-1 py-2.5 mr-[18px] text-[13.5px] font-semibold no-underline border-b-2 ${
              tab === t.key
                ? "text-accent border-accent"
                : "text-faint border-transparent hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {list.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              href={`/membre/evenements/${e.id}`}
              registered={mesIds.includes(e.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState>
          {tab === "mes"
            ? "Vous n’êtes inscrit à aucun événement pour le moment."
            : "Aucun événement dans cette catégorie."}
        </EmptyState>
      )}
    </>
  );
}
