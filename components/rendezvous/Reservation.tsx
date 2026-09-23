import Link from "next/link";
import { CalendarCheck2, Clock, Info } from "lucide-react";
import { Field, INPUT, SubmitButton } from "@/components/form-bits";
import { Card, EmptyState } from "@/components/ui";
import { reserverRendezvous } from "@/lib/actions/rendezvous";
import { fmtHeure, fmtJour } from "@/lib/agenda";
import { finCreneau, HORIZON_JOURS, MENTION_FUSEAU } from "@/lib/rendezvous";
import type { JourProposable, TypeRendezvous } from "@/lib/rendezvous-donnees";

/**
 * Prise de rendez-vous, en trois choix puis une confirmation.
 *
 * Chaque choix est un lien : l'état vit dans l'adresse, donc le retour
 * arrière marche, la page se partage, et rien ne se perd si elle est
 * rechargée. Le formulaire final n'envoie que ce qui a été choisi — l'action
 * serveur revérifie que le créneau est encore libre.
 */

const BASE = "/membre/rendez-vous";

const lien = (c: { type?: string; jour?: string; h?: string }) => {
  const q = new URLSearchParams();
  if (c.type) q.set("type", c.type);
  if (c.jour) q.set("jour", c.jour);
  if (c.h) q.set("h", c.h);
  const s = q.toString();
  return s ? `${BASE}?${s}` : BASE;
};

/** Cadre commun d'un choix : sélectionné, il porte la couleur de la chambre. */
const choix = (actif: boolean) =>
  `no-underline rounded-[var(--radius-s)] border transition-colors ${
    actif
      ? "border-accent bg-accent-soft text-accent"
      : "border-line bg-surface text-ink hover:border-faint hover:bg-surface-2"
  }`;

function Etape({
  n,
  titre,
  aide,
  children,
}: {
  n: number;
  titre: string;
  aide?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div
        aria-hidden
        className="w-7 h-7 shrink-0 rounded-full bg-accent-soft text-accent text-[12.5px] font-bold flex items-center justify-center"
      >
        {n}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-ink">{titre}</div>
        {aide ? (
          <div className="text-[12.4px] text-muted mt-0.5">{aide}</div>
        ) : null}
        <div className="mt-2.5">{children}</div>
      </div>
    </div>
  );
}

export function Reservation({
  types,
  type,
  jours,
  jour,
  heure,
}: {
  types: TypeRendezvous[];
  /** Le type choisi, s'il est encore proposé. */
  type: TypeRendezvous | null;
  /** Les jours qui ont encore un créneau pour ce type. */
  jours: JourProposable[];
  jour: string | null;
  heure: string | null;
}) {
  if (!types.length) {
    return (
      <EmptyState>
        L’équipe n’a pas encore ouvert de rendez-vous. Écrivez-lui depuis la
        page « Contacter l’équipe » : elle vous répondra directement.
      </EmptyState>
    );
  }

  const duJour = jours.find((j) => j.jour === jour)?.creneaux ?? [];

  return (
    <Card className="p-4 sm:p-5 flex flex-col gap-5">
      <Etape n={1} titre="Choisissez le type de rendez-vous">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {types.map((t) => (
            <Link
              key={t.id}
              href={lien({ type: t.id })}
              scroll={false}
              aria-current={t.id === type?.id ? "true" : undefined}
              className={`${choix(t.id === type?.id)} block p-3`}
            >
              <div className="text-[13.8px] font-semibold">{t.titre}</div>
              {t.detail ? (
                <div className="text-[12.4px] text-muted mt-0.5">
                  {t.detail}
                </div>
              ) : null}
              <div className="text-[12px] text-faint mt-1 inline-flex items-center gap-1">
                <Clock size={12} /> {t.duree} minutes
              </div>
            </Link>
          ))}
        </div>
      </Etape>

      {type ? (
        <Etape
          n={2}
          titre="Choisissez le jour"
          aide={`Les ${HORIZON_JOURS} prochains jours, aux heures d’accueil de l’équipe.`}
        >
          {jours.length ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {jours.map((j) => (
                <Link
                  key={j.jour}
                  href={lien({ type: type.id, jour: j.jour })}
                  scroll={false}
                  aria-current={j.jour === jour ? "true" : undefined}
                  className={`${choix(j.jour === jour)} shrink-0 w-[68px] text-center px-2 py-2`}
                >
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.05em]">
                    {fmtJour(j.jour, { weekday: "short" }).replace(".", "")}
                  </div>
                  <div className="text-[18px] font-semibold leading-tight tabular-nums">
                    {fmtJour(j.jour, { day: "numeric" })}
                  </div>
                  <div className="text-[10.5px] text-faint">
                    {fmtJour(j.jour, { month: "short" }).replace(".", "")}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="m-0 text-[13px] text-muted flex items-start gap-2">
              <Info size={15} className="shrink-0 mt-[1px] text-accent" />
              Aucun créneau libre pour ce rendez-vous dans les {
                HORIZON_JOURS
              }{" "}
              prochains jours. Essayez un autre type, ou écrivez à l’équipe.
            </p>
          )}
        </Etape>
      ) : null}

      {type && jour && duJour.length ? (
        <Etape
          n={3}
          titre="Choisissez l’heure"
          aide={`${fmtJour(jour, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })} · ${MENTION_FUSEAU}`}
        >
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {duJour.map((c) => (
              <Link
                key={c}
                href={lien({ type: type.id, jour, h: c })}
                scroll={false}
                aria-current={c === heure ? "true" : undefined}
                className={`${choix(c === heure)} text-center py-2 text-[13.2px] font-semibold tabular-nums`}
              >
                {fmtHeure(c)}
              </Link>
            ))}
          </div>
        </Etape>
      ) : null}

      {type && jour && heure && duJour.includes(heure) ? (
        <Etape n={4} titre="Confirmez">
          <form
            action={reserverRendezvous}
            className="flex flex-col gap-3 max-w-[520px]"
          >
            <input type="hidden" name="typeId" value={type.id} />
            <input type="hidden" name="jour" value={jour} />
            <input type="hidden" name="debut" value={heure} />

            <div className="rounded-[var(--radius-s)] border border-line bg-surface-2 px-3 py-2.5 text-[13.2px]">
              <div className="font-semibold text-ink">{type.titre}</div>
              <div className="text-muted mt-0.5">
                {fmtJour(jour, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {" · "}
                <span className="tabular-nums font-semibold">
                  {fmtHeure(heure)} – {fmtHeure(finCreneau(heure, type.duree))}
                </span>
              </div>
              <div className="text-faint text-[12px] mt-0.5">
                {MENTION_FUSEAU}
              </div>
            </div>

            <Field
              label="Ce que vous souhaitez aborder"
              hint="Facultatif, mais l’équipe prépare mieux la rencontre."
            >
              <textarea
                name="motif"
                rows={3}
                maxLength={500}
                placeholder="Ex. Appui pour une mission commerciale au Canada"
                className={INPUT}
              />
            </Field>

            <SubmitButton pendingLabel="Réservation…" className="self-start">
              <CalendarCheck2 size={15} /> Confirmer le rendez-vous
            </SubmitButton>

            <p className="m-0 text-[12px] text-faint">
              Une confirmation part par courriel. Un empêchement s’annule d’ici
              : le créneau repart aussitôt à quelqu’un d’autre.
            </p>
          </form>
        </Etape>
      ) : null}
    </Card>
  );
}
