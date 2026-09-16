import Link from "next/link";
import {
  Card,
  Saillant,
  SectionTitle,
  Stat,
  StatusPill,
  TableWrap,
  Td,
  Th,
  ViewHead,
} from "@/components/ui";
import { getEvents, getMemberStats, getMembresATraiter } from "@/lib/queries";
import { fmtDate, isPast } from "@/lib/format";

export default async function TableauDeBord() {
  const [stats, events, aTraiter] = await Promise.all([
    getMemberStats(),
    getEvents(),
    getMembresATraiter(),
  ]);

  const upcoming = events.filter((e) => !isPast(e.date));
  // Le prototype plantait ici quand plus aucun événement n'était à venir.
  const next = upcoming[0];

  return (
    <>
      <ViewHead title={<>Tableau de {<Saillant>bord</Saillant>}</>}>
        Vue d’ensemble de la vie associative : membres, événements, paiements et
        communauté.
      </ViewHead>

      <div className="grid gap-4 mb-[22px] sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          k="Membres actifs"
          v={stats.aJour}
          d={`sur ${stats.total} au total`}
        />
        <Link href="/admin/membres?tab=candidature" className="no-underline">
          <Stat
            k="Nouvelles demandes"
            v={stats.candidatures}
            vClassName="text-warn"
            d="en attente de validation"
          />
        </Link>
        <Link href="/admin/membres?tab=en_retard" className="no-underline">
          <Stat
            k="Cotisations en retard"
            v={stats.enRetard}
            vClassName="text-bad"
            d={`${stats.enAttente} en attente de paiement`}
          />
        </Link>
        <Stat
          k="Prochain événement"
          v={
            <span className="text-[20px]">
              {next
                ? fmtDate(next.date, { day: "2-digit", month: "short" })
                : "—"}
            </span>
          }
          d={next ? next.titre : "Aucun événement à venir"}
        />
      </div>

      <div className="grid gap-4 items-start lg:grid-cols-2">
        <div>
          <SectionTitle>Statut des adhésions</SectionTitle>
          <TableWrap>
            <thead>
              <tr>
                <Th>Membre</Th>
                <Th>Secteur</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {aTraiter.length ? (
                aTraiter.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-2">
                    <Td>
                      <Link
                        href={`/admin/membres/${m.id}`}
                        className="no-underline text-ink hover:text-accent font-medium"
                      >
                        {m.nom}
                      </Link>
                    </Td>
                    <Td className="text-muted">{m.secteur}</Td>
                    <Td>
                      <StatusPill status={m.statut} />
                    </Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <Td className="text-muted">Tous les membres sont à jour.</Td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </div>

        <div>
          <SectionTitle>Inscriptions par événement</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {upcoming.slice(0, 4).map((e) => (
              <Card key={e.id} className="p-4">
                <div className="flex justify-between text-[13px] font-semibold mb-1.5 gap-3">
                  <span>{e.titre}</span>
                  <span className="font-[family-name:var(--font-mono)] text-muted shrink-0">
                    {e.inscrits}/{e.cap}
                  </span>
                </div>
                <div className="h-1.5 rounded-sm bg-surface-3 overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{
                      width: `${Math.round((e.inscrits / e.cap) * 100)}%`,
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
