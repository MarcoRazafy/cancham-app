import type { ReactNode } from "react";
import {
  fmtCotisation,
  FORMULES,
  ORDRE_FORMULES,
  type FormuleId,
} from "@/lib/membership";

/**
 * Bouton radio présenté en carte : une icône en haut à gauche, le rond de
 * sélection en haut à droite. Choisie, la carte prend une bordure verte et un
 * fond vert pâle.
 *
 * Partagé par la demande d'adhésion et la page de bienvenue : les deux
 * posent les mêmes questions, elles doivent les poser de la même façon.
 */
export function ChoixCarte({
  name,
  value,
  defaultChecked,
  requis = false,
  titre,
  detail,
  prix,
  icone,
}: {
  name: string;
  value: string;
  defaultChecked: boolean;
  /** Le groupe doit être renseigné : le navigateur bloque l'envoi à vide. */
  requis?: boolean;
  titre: string;
  detail?: string;
  prix?: string;
  icone?: ReactNode;
}) {
  return (
    <label className="group relative flex flex-col gap-3 rounded-2xl border-2 border-line bg-white p-5 cursor-pointer transition-[background-color,border-color] hover:border-faint has-checked:border-marque-vert has-checked:bg-marque-vert/[0.05] has-focus-visible:ring-4 has-focus-visible:ring-marque-vert/20">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        required={requis}
        className="sr-only"
      />
      {/* Le rond de sélection, dessiné : le bouton natif est masqué. */}
      <span
        aria-hidden
        className="absolute top-4 right-4 w-5 h-5 rounded-full border-2 border-line bg-white transition-colors group-has-checked:border-marque-vert group-has-checked:bg-[radial-gradient(circle,var(--marque-vert)_45%,white_50%)]"
      />
      {icone ? <span className="text-ink">{icone}</span> : null}
      <span className="min-w-0 pr-7">
        <span className="block text-[16px] font-semibold text-ink leading-snug">
          {titre}
        </span>
        {detail ? (
          <span className="block text-[13px] text-muted mt-0.5">{detail}</span>
        ) : null}
      </span>
      {prix ? (
        <span className="text-[20px] font-bold text-marque-vert whitespace-nowrap mt-auto">
          {prix}{" "}
          <span className="text-[13px] font-semibold text-muted">/ an</span>
        </span>
      ) : null}
    </label>
  );
}

/**
 * Le choix de la formule d'adhésion, cartes et tarifs.
 *
 * Le profil est écrit sous le pays : c'est lui qui décide du montant — une
 * entreprise malgache ne paie pas comme un consultant, ni comme un adhérent
 * de la diaspora. Sans cette mention, le candidat choisit un prix sans savoir
 * s'il y a droit.
 *
 * La grille vient de `lib/membership.ts`, celle qui facture : la demande
 * d'adhésion ne peut pas annoncer un tarif que la plateforme ne pratique plus.
 */
export function ChoixFormules({ actuelle }: { actuelle?: FormuleId | null }) {
  return (
    /*
      Une carte par ligne, et deux seulement quand le cadre est assez large :
      la mesure se prend sur le conteneur, pas sur la fenêtre — le formulaire
      d'adhésion occupe une colonne étroite au milieu d'un grand écran, et
      « Madagascar » s'y faisait couper par le rond de sélection.
    */
    <div className="@container">
      <div className="grid gap-3 @md:grid-cols-2">
        {ORDRE_FORMULES.map((f) => (
          <ChoixCarte
            key={f}
            name="formule"
            value={f}
            requis
            defaultChecked={actuelle === f}
            titre={FORMULES[f].pays}
            detail={FORMULES[f].profil}
            prix={fmtCotisation(f)}
          />
        ))}
      </div>
    </div>
  );
}
