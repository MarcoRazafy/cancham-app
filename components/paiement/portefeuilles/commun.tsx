import type { CSSProperties } from "react";
import { ShieldCheck } from "lucide-react";
import { Copiable } from "@/components/paiement/Copiable";
import type { Devise } from "@/lib/membership";
import { MODES } from "@/lib/modes-reglement";
import {
  numeroLisible,
  PORTEFEUILLES,
  type Portefeuille,
} from "@/lib/portefeuilles";

/**
 * Ce que partagent les trois écrans de portefeuille.
 *
 * Chaque opérateur a son dessin — MVola en panneau latéral, Orange en
 * bandeau et chevrons, Airtel en cartes arrondies —, mais le parcours est le
 * même : le numéro, l'envoi, le reçu. Les champs, les coordonnées à recopier
 * et les règles d'étape vivent donc ici, une seule fois ; chaque dessin ne
 * décide que de la forme.
 */

export interface PropsTunnel {
  mode: Portefeuille;
  reglementId: string;
  reference: string;
  montant: number;
  devise: Devise;
  /** Ce qui est réglé : l'objet de la facture. */
  objet: string;
  /** À quel nom le compte de la chambre est ouvert. */
  titulaire: string;
  /** Le numéro de la chambre, vide tant que l'équipe ne l'a pas publié. */
  numeroChambre: string;
  /** Le numéro du membre, une fois saisi. */
  telephone: string | null;
  statut: string;
  /** Revenir sur le numéro déjà saisi. */
  modifier?: boolean;
  /** Où revenir pour choisir un autre moyen. */
  retour: string;
}

export type Etape = 1 | 2 | 3;

export const ETAPES = ["Montant", "Envoi", "Reçu"] as const;

/** Où en est le membre : le numéro à donner, l'envoi à faire, ou c'est dit. */
export function etapeDu(p: PropsTunnel): Etape {
  if (p.statut === "annonce" || p.statut === "reussie") return 3;
  return p.telephone && !p.modifier ? 2 : 1;
}

/** Les couleurs de l'opérateur, posées une fois sur le tunnel. */
export function couleurs(mode: Portefeuille): CSSProperties {
  const c = PORTEFEUILLES[mode].palette;
  return {
    "--pf-fond": c.fond,
    "--pf-encre": c.encre,
    "--pf-douce": c.douce,
    "--pf-valeur": c.valeur,
    "--pf-bouton": c.bouton,
    "--pf-sur-bouton": c.surBouton,
    "--pf-bouton-survol": c.boutonSurvol,
  } as CSSProperties;
}

export const LOGOS: Record<
  Portefeuille,
  { src: string; largeur: number; hauteur: number }
> = {
  mvola: { src: "/paiement/mvola.png", largeur: 811, hauteur: 378 },
  orange_money: {
    src: "/paiement/orange-money.png",
    largeur: 738,
    hauteur: 366,
  },
  airtel_money: {
    src: "/paiement/airtel-money.png",
    largeur: 520,
    hauteur: 229,
  },
};

/**
 * Le numéro du membre, avec l'indicatif devant.
 *
 * Les classes donnent la forme — chaque opérateur a la sienne —, le reste
 * est commun : clavier numérique sur téléphone, saisie automatique, et une
 * aide visible sous le champ qui dit quels préfixes sont attendus.
 */
export function ChampNumero({
  mode,
  telephone,
  cadre,
  prefixe,
  champ,
}: {
  mode: Portefeuille;
  telephone: string | null;
  cadre: string;
  prefixe: string;
  champ: string;
}) {
  const { prefixes, operateur } = PORTEFEUILLES[mode];
  return (
    <div>
      <label
        htmlFor="telephone-portefeuille"
        className="mb-1.5 block text-[14px] font-bold text-ink"
      >
        Votre numéro {MODES[mode].titre}
      </label>
      <div className={`flex overflow-hidden ${cadre}`}>
        <span
          className={`flex shrink-0 items-center px-4 text-[15px] font-bold ${prefixe}`}
        >
          +261
        </span>
        <input
          id="telephone-portefeuille"
          name="telephone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          defaultValue={telephone ? numeroLisible(telephone) : ""}
          placeholder={`${prefixes[0]} 12 345 67`}
          aria-describedby="aide-telephone"
          className={`min-h-12 w-full min-w-0 border-0 bg-surface px-4 text-[16px] text-ink outline-none placeholder:text-faint ${champ}`}
        />
      </div>
      <p id="aide-telephone" className="m-0 mt-1.5 text-[13px] text-muted">
        La ligne {operateur} depuis laquelle vous payez — elle commence par{" "}
        {prefixes.join(" ou ")}.
      </p>
    </div>
  );
}

/** Où envoyer l'argent : le numéro de la chambre, son nom, la référence. */
export function CoordonneesEnvoi({
  mode,
  reference,
  numeroChambre,
  titulaire,
}: {
  mode: Portefeuille;
  reference: string;
  numeroChambre: string;
  titulaire: string;
}) {
  const titre = MODES[mode].titre;
  return (
    <div className="grid gap-2.5">
      {numeroChambre ? (
        <Copiable
          libelle={`Numéro ${titre} de la chambre`}
          valeur={numeroLisible(numeroChambre)}
        />
      ) : (
        <p
          role="alert"
          className="m-0 rounded-[var(--radius-m)] border border-warn/40 bg-warn-soft px-4 py-3 text-[14px] text-warn"
        >
          Le numéro {titre} de la chambre n’est pas encore publié. Écrivez à
          l’équipe : elle vous l’indiquera.
        </p>
      )}
      {titulaire ? (
        <Copiable libelle="Au nom de" valeur={titulaire} mono={false} />
      ) : null}
      <Copiable
        libelle="Référence à mettre en note du transfert"
        valeur={reference}
        accent
      />
      <p className="m-0 text-[13px] text-muted">
        C’est la référence qui permet à l’équipe de retrouver votre règlement.
      </p>
    </div>
  );
}

/** La référence que l'opérateur envoie par SMS — facultative, mais utile. */
export function ChampRefSms({ champ }: { champ: string }) {
  return (
    <div>
      <label
        htmlFor="ref-sms"
        className="mb-1.5 block text-[14px] font-bold text-ink"
      >
        Référence du SMS de confirmation{" "}
        <span className="font-normal text-muted">(facultatif)</span>
      </label>
      <input
        id="ref-sms"
        name="refBancaire"
        maxLength={60}
        placeholder="Celle que votre opérateur vous envoie"
        className={`min-h-12 w-full border border-line bg-surface px-4 text-[16px] text-ink placeholder:text-faint focus:border-[var(--pf-bouton)] focus:outline-none ${champ}`}
      />
    </div>
  );
}

export function MentionSecret({
  mode,
  className = "",
}: {
  mode: Portefeuille;
  className?: string;
}) {
  return (
    <p
      className={`m-0 flex items-start gap-2 text-[13px] leading-snug ${className}`}
    >
      <ShieldCheck size={16} aria-hidden className="mt-px shrink-0" />
      La CanCham ne vous demandera jamais votre code secret {MODES[mode].titre}.
    </p>
  );
}
