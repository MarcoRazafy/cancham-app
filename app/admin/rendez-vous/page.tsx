import { AlertTriangle, CalendarClock, Clock } from "lucide-react";
import { CarteRendezvous } from "@/components/rendezvous/CarteRendezvous";
import {
  FermerPlage,
  ModifierType,
  NouveauType,
  NouvellePlage,
} from "@/components/rendezvous/Reglages";
import {
  Banner,
  Card,
  EmptyState,
  Pill,
  SectionTitle,
  ViewHead,
} from "@/components/ui";
import { fmtHeure } from "@/lib/agenda";
import { aujourdhuiISO } from "@/lib/format";
import { JOURS_SEMAINE, MENTION_FUSEAU } from "@/lib/rendezvous";
import {
  getPlages,
  getRendezvousEquipe,
  getTypesRendezvous,
} from "@/lib/rendezvous-donnees";
import { getCurrentUser } from "@/lib/session";

/**
 * Rendez-vous, côté équipe : ce qui est pris, ce qu'on propose, et quand on
 * reçoit.
 *
 * Les créneaux offerts aux membres se déduisent des deux réglages de droite :
 * une durée découpe une plage d'accueil. Rien à tenir à jour en plus — un
 * rendez-vous pris retire son créneau de lui-même.
 */
export default async function RendezvousEquipePage() {
  await getCurrentUser("admin");

  const [rendezvous, types, plages] = await Promise.all([
    getRendezvousEquipe(),
    getTypesRendezvous(true),
    getPlages(),
  ]);

  const proposes = types.filter((t) => t.actif);
  const manque = !proposes.length || !plages.length;

  return (
    <>
      <ViewHead title="Rendez-vous" action={<NouveauType />}>
        Les membres réservent un créneau parmi ceux que vous laissez ouverts.
        Toutes les heures sont à l’{MENTION_FUSEAU}.
      </ViewHead>

      {manque ? (
        <div className="mb-5">
          <Banner
            tone="warn"
            icon={<AlertTriangle size={17} />}
            title="Aucun rendez-vous ne peut être pris pour l’instant"
          >
            {!proposes.length
              ? "Aucun type de rendez-vous n’est proposé aux membres."
              : "Aucune plage d’accueil n’est ouverte : les types n’ont aucun créneau à offrir."}
          </Banner>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        {/* ==================== Ce qui est pris ==================== */}
        <section>
          <SectionTitle>
            À venir
            {rendezvous.length ? ` (${rendezvous.length})` : ""}
          </SectionTitle>
          {rendezvous.length ? (
            <div className="flex flex-col gap-2.5">
              {rendezvous.map((rdv) => (
                <CarteRendezvous
                  key={rdv.id}
                  rdv={rdv}
                  aujourdhui={aujourdhuiISO()}
                  retour="/admin/rendez-vous"
                  cote="equipe"
                />
              ))}
            </div>
          ) : (
            <EmptyState>
              <CalendarClock size={22} className="mx-auto mb-2 text-faint" />
              Aucun rendez-vous réservé pour le moment.
            </EmptyState>
          )}
        </section>

        {/* ==================== Les réglages ==================== */}
        <aside className="flex flex-col gap-6">
          <section>
            <SectionTitle>Ce que vous proposez</SectionTitle>
            <Card className="p-3.5 flex flex-col gap-2.5">
              {types.length ? (
                types.map((t) => (
                  <div key={t.id} className="flex items-start gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.6px] font-semibold text-ink">
                          {t.titre}
                        </span>
                        {t.actif ? null : <Pill tone="muted">Masqué</Pill>}
                      </div>
                      <div className="text-[12.3px] text-muted mt-0.5 flex items-center gap-1">
                        <Clock size={12} /> {t.duree} minutes
                      </div>
                      {t.detail ? (
                        <div className="text-[12.3px] text-faint mt-0.5">
                          {t.detail}
                        </div>
                      ) : null}
                    </div>
                    <ModifierType type={t} />
                  </div>
                ))
              ) : (
                <p className="m-0 text-[13px] text-muted">
                  Aucun type pour l’instant. « Nouveau type » en crée un — «
                  Entretien d’accompagnement », par exemple.
                </p>
              )}
            </Card>
          </section>

          <section>
            <SectionTitle>Heures d’accueil</SectionTitle>
            <Card className="p-3.5 flex flex-col gap-3">
              {plages.length ? (
                <div className="flex flex-col gap-2">
                  {JOURS_SEMAINE.filter((j) =>
                    plages.some((p) => p.jour === j.cle),
                  ).map((j) => (
                    <div key={j.cle}>
                      <div className="text-[11.5px] font-bold uppercase tracking-[0.05em] text-muted mb-1">
                        {j.libelle}
                      </div>
                      <div className="flex flex-col gap-1">
                        {plages
                          .filter((p) => p.jour === j.cle)
                          .map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-2 text-[13.2px] tabular-nums"
                            >
                              <span className="flex-1">
                                {fmtHeure(p.debut)} – {fmtHeure(p.fin)}
                              </span>
                              <FermerPlage
                                id={p.id}
                                libelle={`${j.libelle} ${p.debut} – ${p.fin}`}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="m-0 text-[13px] text-muted">
                  Aucune plage ouverte. Déclarez celles où l’équipe reçoit : les
                  créneaux s’y découpent tout seuls.
                </p>
              )}
              <div>
                <NouvellePlage />
              </div>
            </Card>
          </section>
        </aside>
      </div>
    </>
  );
}
