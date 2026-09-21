import Image from "next/image";
import { Partage } from "@/components/Partage";
import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, Plus } from "lucide-react";
import { EnTeteAdmin, Jauge, Onglets, Vide } from "@/components/admin/ui";
import { Card, Pill, Saillant } from "@/components/ui";
import { fmtMoney, isPast, parseISO } from "@/lib/format";
import { getEvents } from "@/lib/queries";

export default async function AdminEvenements({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const { periode: demande } = await searchParams;
  const periode = demande === "passes" ? "passes" : "a_venir";

  const events = await getEvents();
  const aVenir = events.filter((e) => !isPast(e.date));
  const passes = events
    .filter((e) => isPast(e.date))
    .sort((a, b) => b.date.localeCompare(a.date));
  const liste = periode === "passes" ? passes : aVenir;

  const inscritsAVenir = aVenir.reduce((n, e) => n + e.inscrits, 0);
  const placesAVenir = aVenir.reduce((n, e) => n + e.cap, 0);

  return (
    <>
      <EnTeteAdmin
        surtitre="Programme"
        titre={
          <>
            Gestion des <Saillant>événements</Saillant>
          </>
        }
        actions={
          <Link
            href="/admin/evenements/nouveau"
            className="btn-action btn-action-sm no-underline"
          >
            <Plus size={15} /> Nouvel événement
          </Link>
        }
      >
        {aVenir.length} rendez-vous à venir, {inscritsAVenir} inscrits pour{" "}
        {placesAVenir} places. Créez, suivez les inscriptions, pointez les
        arrivées le jour J.
      </EnTeteAdmin>

      <Onglets
        actif={periode}
        onglets={[
          {
            cle: "a_venir",
            libelle: "À venir",
            href: "/admin/evenements",
            compte: aVenir.length,
          },
          {
            cle: "passes",
            libelle: "Passés",
            href: "/admin/evenements?periode=passes",
            compte: passes.length,
          },
        ]}
      />

      {liste.length ? (
        <div className="cascade grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {liste.map((e) => {
            const d = parseISO(e.date);
            const complet = e.inscrits >= e.cap;
            return (
              <Link
                key={e.id}
                href={`/admin/evenements/${e.id}`}
                prefetch
                className="no-underline group block"
              >
                <Card className="carte-filet filet-bas filet-degrade p-0 h-full overflow-hidden flex flex-col">
                  <Partage nom={`evenement-${e.id}`}>
                    <div className="relative aspect-[16/9] bg-surface-2 overflow-hidden">
                      {e.photo ? (
                        <Image
                          src={e.photo}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-faint">
                          <CalendarDays size={30} />
                        </span>
                      )}
                      <span className="pastille absolute top-3 left-3 rounded-lg bg-accent text-white text-center px-3 py-1.5 leading-none">
                        <span className="titre block text-[20px]">
                          {d.getDate()}
                        </span>
                        <span className="block text-[10px] font-bold uppercase tracking-wider mt-0.5">
                          {d
                            .toLocaleDateString("fr-FR", { month: "short" })
                            .replace(".", "")}
                        </span>
                      </span>
                      <span className="absolute top-3 right-3">
                        <Pill tone={e.payant ? "warn" : "ok"}>
                          {e.payant ? fmtMoney(e.prix) : "Inclus"}
                        </Pill>
                      </span>
                    </div>
                  </Partage>
                  <div className="p-5 flex-1 flex flex-col">
                    <h2 className="text-[16px] m-0 text-ink">{e.titre}</h2>
                    <div className="flex items-center gap-1.5 text-[12.8px] text-muted mt-1.5">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">
                        {e.lieu} · {e.format}
                      </span>
                    </div>
                    <div className="mt-auto pt-4">
                      <div className="flex items-baseline justify-between text-[12.5px] mb-1.5">
                        <span className="text-muted">Inscriptions</span>
                        <span
                          className={`tabular-nums font-semibold ${complet ? "text-accent" : "text-ink"}`}
                        >
                          {e.inscrits}/{e.cap}
                          {complet ? " · complet" : ""}
                        </span>
                      </div>
                      <Jauge
                        valeur={e.inscrits}
                        max={e.cap}
                        teinte={complet ? "rouge" : "vert"}
                      />
                      <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-accent group-hover:underline">
                        Gérer l’événement <ChevronRight size={15} />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <Vide icone={<CalendarDays size={26} />}>
            {periode === "passes"
              ? "Aucun événement passé."
              : "Aucun événement programmé."}
          </Vide>
        </Card>
      )}
    </>
  );
}
