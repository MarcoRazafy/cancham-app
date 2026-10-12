import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Smartphone } from "lucide-react";
import { BoutonMarque } from "@/components/paiement/BoutonMarque";
import { payerParPortefeuille } from "@/lib/actions/paiements";
import { fmtMontant, type Devise } from "@/lib/membership";
import { MONTANT_MINIMUM_EN_LIGNE } from "@/lib/vanillapay";
import { MODES } from "@/lib/modes-reglement";
import {
  numeroLisible,
  PORTEFEUILLES,
  type Portefeuille,
} from "@/lib/portefeuilles";

export interface PropsTunnel {
  mode: Portefeuille;
  reglementId: string;
  reference: string;
  montant: number;
  devise: Devise;
  objet: string;
  titulaire: string;
  telephone: string | null;
  statut: string;
  modifier?: boolean;
  retour: string;
  raccorde: boolean;
  marchand?: string | null;
}

export function PaiementDirect({
  p,
  className = "",
}: {
  p: PropsTunnel;
  className?: string;
}) {
  const titre = MODES[p.mode].titre;
  const somme = fmtMontant(p.montant, p.devise);
  const billets = /^participation/i.test(p.objet);
  if (!p.raccorde) {
    return (
      <div
        role="alert"
        className={`rounded-[var(--radius-m)] border border-warn/40 bg-warn-soft p-5 text-[14px] leading-relaxed text-warn ${className}`}
      >
        Le paiement par {titre} n’est pas disponible pour ce règlement : il faut
        un montant d’au moins {fmtMontant(MONTANT_MINIMUM_EN_LIGNE, "MGA")}, en
        ariary.{" "}
        <Link href={p.retour} className="font-semibold text-warn underline">
          Choisir un autre moyen
        </Link>
      </div>
    );
  }
  return (
    <div
      className={`rounded-[var(--radius-m)] border-2 border-[var(--pf-fond)] p-5 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--pf-fond)] text-[var(--pf-encre)]">
          <Smartphone size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="m-0 text-[19px] font-bold leading-tight">
            Payer maintenant, depuis {titre}
          </h2>
          <p className="m-0 mt-1.5 text-[13.5px] leading-relaxed text-muted">
            Sur la page de paiement, confirmez votre numéro
            {p.telephone ? ` (${numeroLisible(p.telephone)})` : ""} : votre
            téléphone reçoit une demande de confirmation. Validez-la avec votre
            code secret {titre}, et {somme} sont débités, plus les frais de
            l’opérateur. Votre reçu
            {billets ? " et vos billets arrivent" : " arrive"} aussitôt.
          </p>
        </div>
      </div>
      <form
        action={payerParPortefeuille}
        className="mt-4 flex flex-wrap items-center gap-4"
      >
        <input type="hidden" name="reglementId" value={p.reglementId} />
        <BoutonMarque className="rounded-[var(--radius-m)]">
          Payer {somme} par {titre} <ArrowRight size={17} />
        </BoutonMarque>
      </form>
      {p.marchand ? (
        <p className="m-0 mt-3 text-[12.5px] leading-snug text-muted">
          Sur la page de paiement, le marchand affiché est{" "}
          <b className="text-ink">{p.marchand}</b> : il encaisse pour le compte
          de la CanCham.
        </p>
      ) : null}
    </div>
  );
}

export type Etape = 1 | 2 | 3;

export const ETAPES = ["Montant", "Paiement", "Reçu"] as const;

export function etapeDu(p: PropsTunnel): Etape {
  if (p.statut === "annonce" || p.statut === "reussie") return 3;
  return p.telephone && !p.modifier ? 2 : 1;
}

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
