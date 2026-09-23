import { Building2, Clock, Mail, Phone } from "lucide-react";
import { AnnulerRendezvous } from "@/components/rendezvous/AnnulerRendezvous";
import { Card } from "@/components/ui";
import { fmtJour, jourRelatif, plageHoraire } from "@/lib/agenda";
import type { RendezvousPris } from "@/lib/rendezvous-donnees";

/**
 * Un rendez-vous tel qu'il s'affiche dans une liste : la date en pavé, le
 * type, l'horaire, et ce qui compte pour celui qui regarde — l'équipe veut
 * savoir qui vient et pourquoi, le membre le sait déjà.
 */
export function CarteRendezvous({
  rdv,
  aujourdhui,
  retour,
  cote,
}: {
  rdv: RendezvousPris;
  aujourdhui: string;
  retour: string;
  cote: "membre" | "equipe";
}) {
  const horaire = plageHoraire(rdv.debut, rdv.fin) ?? rdv.debut;

  return (
    // Sur un téléphone, le bouton passe sous le contenu plutôt que de lui
    // voler sa largeur : le motif se lit en entier.
    <Card className="p-3.5 flex flex-wrap items-start gap-3.5">
      {/* La prune des rendez-vous dans l'agenda : même couleur, même lecture. */}
      <div className="w-[58px] shrink-0 text-center rounded-[var(--radius-s)] bg-[#5b4b8a] text-white py-1.5">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-white/75">
          {fmtJour(rdv.jour, { month: "short" }).replace(".", "")}
        </div>
        <div className="text-[21px] font-semibold leading-none my-[3px] tabular-nums">
          {fmtJour(rdv.jour, { day: "numeric" })}
        </div>
        <div className="text-[10.5px] text-white/70">
          {fmtJour(rdv.jour, { weekday: "short" }).replace(".", "")}
        </div>
      </div>

      <div className="min-w-0 flex-1 basis-[220px]">
        <div className="text-[14.6px] font-semibold text-ink leading-snug">
          {rdv.type.titre}
        </div>
        <div className="text-[12.8px] text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
            <Clock size={12.5} /> {horaire}
          </span>
          <span aria-hidden>·</span>
          <span>{jourRelatif(rdv.jour, aujourdhui)}</span>
          <span aria-hidden>·</span>
          <span>{rdv.type.duree} min</span>
        </div>

        {cote === "equipe" ? (
          <div className="text-[12.8px] text-muted mt-1.5 flex flex-col gap-0.5">
            <span className="font-semibold text-ink">{rdv.personne.nom}</span>
            {rdv.entreprise ? (
              <span className="inline-flex items-center gap-1">
                <Building2 size={12.5} /> {rdv.entreprise}
              </span>
            ) : null}
            <span className="flex items-center gap-2.5 flex-wrap">
              <a
                href={`mailto:${rdv.personne.email}`}
                className="inline-flex items-center gap-1 text-muted no-underline hover:text-accent"
              >
                <Mail size={12.5} /> {rdv.personne.email}
              </a>
              {rdv.personne.tel ? (
                <a
                  href={`tel:${rdv.personne.tel}`}
                  className="inline-flex items-center gap-1 text-muted no-underline hover:text-accent"
                >
                  <Phone size={12.5} /> {rdv.personne.tel}
                </a>
              ) : null}
            </span>
          </div>
        ) : null}

        {rdv.motif ? (
          <p className="m-0 mt-2 text-[12.8px] text-ink bg-surface-2 border border-line rounded-[var(--radius-s)] px-2.5 py-1.5 whitespace-pre-line">
            {rdv.motif}
          </p>
        ) : null}
      </div>

      <div className="ml-auto shrink-0">
        <AnnulerRendezvous
          id={rdv.id}
          quand={`${fmtJour(rdv.jour, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}, ${horaire}`}
          retour={retour}
          prevenu={cote === "equipe" ? "le membre" : "l’équipe"}
        />
      </div>
    </Card>
  );
}
