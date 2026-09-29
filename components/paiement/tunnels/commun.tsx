import Image from "next/image";
import type { Coordonnees } from "@/lib/modes-reglement";
import type { Devise } from "@/lib/membership";

/**
 * Ce que partagent les écrans de virement, de dépôt, d'espèces et de carte.
 *
 * Chacun a son dessin, repris de sa maquette ; ils reçoivent tous les mêmes
 * données, et portent le même logo en haut à droite.
 */
export interface PropsReglement {
  reglementId: string;
  reference: string;
  montant: number;
  devise: Devise;
  /** Ce qui est réglé : l'objet de la facture. */
  objet: string;
  numeroFacture: string | null;
  statut: string;
  /** Où revenir pour choisir un autre moyen. */
  retour: string;
  /** L'étape demandée dans l'adresse (`?etape=2`). */
  etape: string | undefined;
  coordonnees: Coordonnees;
  /** L'entreprise qui règle. */
  payeur: string;
  /** La personne connectée, qui fait le geste. */
  personne: string;
  /** Ce que le membre a déjà saisi pour ce règlement. */
  detail: Record<string, unknown>;
  /** Aujourd'hui, au format ISO — le fuseau de la chambre, pas celui du serveur. */
  aujourdhui: string;
}

/** Le chiffre seul, « 250 000 », pour les champs qui portent la devise à part. */
export function chiffre(montant: number): string {
  return montant.toLocaleString("fr-FR");
}

export function sigle(devise: Devise): string {
  return devise === "CAD" ? "$" : "Ar";
}

/** Un règlement dont l'arrivée est annoncée ou constatée : l'étape finale. */
export function conclu(statut: string): boolean {
  return statut === "annonce" || statut === "reussie";
}

/**
 * Le logo de la chambre, dans sa pastille blanche : posé sur un bandeau
 * sombre ou une page claire, il reste lisible partout.
 */
export function PastilleCanCham({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex h-12 shrink-0 items-center rounded-[10px] bg-white px-3 ${className}`}
    >
      {/*
        Le logo compact, la feuille et le nom : l'horizontal, réduit à cette
        hauteur, ne laissait plus rien lire.
      */}
      <Image
        src="/marque/logo-vertical.png"
        alt="CanCham"
        width={760}
        height={547}
        className="h-9 w-auto object-contain"
      />
    </span>
  );
}
