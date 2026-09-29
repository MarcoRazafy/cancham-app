import type { ModeReglement } from "@/lib/modes-reglement";

/**
 * Les trois portefeuilles mobiles, et ce qui les distingue.
 *
 * Chacun a ses couleurs, son menu, et ses préfixes de numéro : on ne paie
 * pas MVola depuis une ligne Orange. L'écran de règlement prend la teinte de
 * l'opérateur choisi — le membre reconnaît tout de suite où il est.
 *
 * Les couleurs sont relevées dans les logos fournis par la chambre, pixel
 * par pixel : ce sont exactement celles des marques.
 */
export type Portefeuille = Extract<
  ModeReglement,
  "mvola" | "orange_money" | "airtel_money"
>;

export interface DescriptionPortefeuille {
  /** L'opérateur derrière le portefeuille. */
  operateur: string;
  /** Le menu à composer sur le téléphone. */
  ussd: string;
  /** Les préfixes des lignes de l'opérateur, à Madagascar. */
  prefixes: string[];
  palette: {
    /** Fond du panneau de gauche. */
    fond: string;
    /** Texte principal sur ce fond. */
    encre: string;
    /** Texte secondaire sur ce fond. */
    douce: string;
    /** La couleur de la marque, pour les montants sur fond sombre. */
    valeur: string;
  };
}

export const PORTEFEUILLES: Record<Portefeuille, DescriptionPortefeuille> = {
  mvola: {
    operateur: "Telma",
    ussd: "#111#",
    prefixes: ["034", "038"],
    palette: {
      fond: "#ffde00",
      encre: "#10241a",
      douce: "#3c4a3f",
      valeur: "#ffde00",
    },
  },
  orange_money: {
    operateur: "Orange",
    ussd: "#144#",
    prefixes: ["032", "037"],
    palette: {
      fond: "#fe6601",
      encre: "#1c1008",
      douce: "#4a2d15",
      valeur: "#fe9247",
    },
  },
  airtel_money: {
    operateur: "Airtel",
    ussd: "#436#",
    prefixes: ["033"],
    palette: {
      fond: "#ed1c24",
      encre: "#ffffff",
      douce: "#ffd8d9",
      valeur: "#ffd200",
    },
  },
};

export function estPortefeuilleConnu(m: ModeReglement): m is Portefeuille {
  return m === "mvola" || m === "orange_money" || m === "airtel_money";
}

/**
 * Un numéro malgache tel qu'on le compose : dix chiffres, l'indicatif et les
 * espaces retirés. Rien d'autre n'est accepté — un numéro approximatif se
 * traduirait par un règlement qu'on ne saurait pas rattacher.
 */
export function normaliserNumero(saisi: string): string | null {
  const chiffres = saisi.replace(/[^\d]/g, "").replace(/^261/, "0");
  const dix = chiffres.startsWith("0") ? chiffres : `0${chiffres}`;
  return /^0\d{9}$/.test(dix) ? dix : null;
}

/** Le numéro appartient-il bien à l'opérateur du portefeuille choisi ? */
export function numeroDeLOperateur(
  mode: Portefeuille,
  numero: string,
): boolean {
  return PORTEFEUILLES[mode].prefixes.some((p) => numero.startsWith(p));
}

/** `0343859614` → `034 38 596 14`, comme on le lit sur un téléphone. */
export function numeroLisible(numero: string): string {
  const n = normaliserNumero(numero);
  if (!n) return numero;
  return `${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
}
