import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * Les moyens de règlement de la chambre.
 *
 * Deux familles. Les deux premiers s'encaissent tout seuls, par le
 * prestataire : la plateforme apprend le paiement sans que personne n'ait
 * rien à faire. Les cinq autres se passent hors ligne — la plateforme donne
 * les coordonnées et une référence à recopier, le membre annonce qu'il a
 * payé, et c'est l'équipe qui constate l'arrivée de l'argent.
 *
 * Un moyen dont les coordonnées manquent n'est pas proposé : mieux vaut un
 * choix plus court qu'un virement envoyé dans le vide.
 */

export type ModeReglement =
  | "carte"
  | "mobile_money"
  | "virement"
  | "depot"
  | "especes"
  | "international"
  | "plateforme";

export interface DescriptionMode {
  titre: string;
  detail: string;
  /** Encaissé par le prestataire, sans intervention de l'équipe. */
  enLigne: boolean;
}

export const MODES: Record<ModeReglement, DescriptionMode> = {
  carte: {
    titre: "Carte bancaire",
    detail: "Visa, Mastercard. Paiement immédiat, sur la page du prestataire.",
    enLigne: true,
  },
  mobile_money: {
    titre: "Mobile money",
    detail:
      "MVola, Orange Money, Airtel Money. Validation sur votre téléphone.",
    enLigne: true,
  },
  virement: {
    titre: "Virement bancaire",
    detail: "Depuis votre banque, vers le compte de la chambre.",
    enLigne: false,
  },
  depot: {
    titre: "Dépôt au guichet",
    detail: "Espèces déposées à la banque, avec un bordereau pré-rempli.",
    enLigne: false,
  },
  especes: {
    titre: "Espèces",
    detail: "Remise en main propre à l’équipe, contre reçu.",
    enLigne: false,
  },
  international: {
    titre: "Virement international",
    detail: "Depuis l’étranger, par IBAN et BIC.",
    enLigne: false,
  },
  plateforme: {
    titre: "Plateforme de paiement",
    detail: "PayPal, Wise et consorts.",
    enLigne: false,
  },
};

export const ORDRE_MODES = Object.keys(MODES) as ModeReglement[];

export function estModeReglement(v: string): v is ModeReglement {
  return (ORDRE_MODES as string[]).includes(v);
}

/** Les coordonnées de la chambre, avec leurs valeurs vides par défaut. */
export type Coordonnees = {
  titulaire: string;
  banque: string;
  agence: string;
  rib: string;
  iban: string;
  bic: string;
  mvola: string;
  orangeMoney: string;
  airtelMoney: string;
  adresseBureau: string;
  horaires: string;
  plateformes: string;
};

const VIDES: Coordonnees = {
  titulaire: "",
  banque: "",
  agence: "",
  rib: "",
  iban: "",
  bic: "",
  mvola: "",
  orangeMoney: "",
  airtelMoney: "",
  adresseBureau: "",
  horaires: "",
  plateformes: "",
};

/**
 * Les coordonnées de la chambre.
 *
 * Une seule ligne, créée à la première lecture : l'équipe n'a pas à penser à
 * l'initialiser avant de pouvoir remplir le formulaire.
 */
export async function getCoordonneesPaiement(): Promise<Coordonnees> {
  const c = await prisma.coordonneesPaiement.findUnique({
    where: { id: "uniques" },
  });
  if (!c) return VIDES;
  return {
    titulaire: c.titulaire,
    banque: c.banque,
    agence: c.agence,
    rib: c.rib,
    iban: c.iban,
    bic: c.bic,
    mvola: c.mvola,
    orangeMoney: c.orangeMoney,
    airtelMoney: c.airtelMoney,
    adresseBureau: c.adresseBureau,
    horaires: c.horaires,
    plateformes: c.plateformes,
  };
}

/**
 * Ce qu'il faut pour qu'un moyen soit proposable.
 *
 * La carte et le mobile money dépendent du prestataire, pas de coordonnées
 * saisies : c'est `vanillaPayActif()` qui décide, ailleurs.
 */
export function modeDisponible(
  mode: ModeReglement,
  c: Coordonnees,
  enLigneActif: boolean,
): boolean {
  switch (mode) {
    case "carte":
      return enLigneActif;
    // Tant que l'encaissement automatique n'est pas branché, un numéro de
    // portefeuille suffit : le membre envoie, puis annonce son règlement.
    case "mobile_money":
      return enLigneActif || Boolean(c.mvola || c.orangeMoney || c.airtelMoney);
    case "virement":
      return Boolean(c.rib || c.iban);
    case "depot":
      return Boolean(c.rib && c.banque);
    case "especes":
      return Boolean(c.adresseBureau);
    case "international":
      return Boolean(c.iban && c.bic);
    case "plateforme":
      return Boolean(c.plateformes.trim());
  }
}

/**
 * La référence d'un règlement : `CC-2026-K7Q2PX`.
 *
 * C'est elle que le membre recopie dans le motif de son virement, et elle
 * seule qui permet de rattacher l'argent arrivé à qui l'a envoyé. Sans
 * chiffre parlant ni séquence : deux règlements du même jour ne doivent pas
 * se ressembler au point qu'on les confonde.
 */
export function referenceReglement(annee = new Date().getFullYear()): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffixe = "";
  for (const n of randomBytes(6)) suffixe += alphabet[n % alphabet.length];
  return `CC-${annee}-${suffixe}`;
}

/** Montant en toutes lettres, pour un bordereau de versement. */
export function enLettres(n: number): string {
  const unites = [
    "zéro",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
  ];
  const dizaines = [
    "",
    "",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
    "soixante",
    "quatre-vingt",
    "quatre-vingt",
  ];

  const petit = (x: number): string => {
    if (x < 17) return unites[x];
    if (x < 20) return `dix-${unites[x - 10]}`;
    if (x < 100) {
      const d = Math.floor(x / 10);
      const u = x % 10;
      const base = d === 7 || d === 9 ? dizaines[d] : dizaines[d];
      const reste = d === 7 || d === 9 ? petit(10 + u) : u ? unites[u] : "";
      if (!reste) return d === 8 ? `${base}s` : base;
      return `${base}${u === 1 && d !== 8 && d !== 7 && d !== 9 ? "-et-" : "-"}${reste}`;
    }
    if (x < 1000) {
      const c = Math.floor(x / 100);
      const reste = x % 100;
      const cent = c === 1 ? "cent" : `${unites[c]}-cent${reste ? "" : "s"}`;
      return reste ? `${cent}-${petit(reste)}` : cent;
    }
    return String(x);
  };

  if (n === 0) return "zéro";
  const millions = Math.floor(n / 1_000_000);
  const milliers = Math.floor((n % 1_000_000) / 1000);
  const reste = n % 1000;

  const morceaux: string[] = [];
  if (millions) {
    morceaux.push(
      millions === 1 ? "un-million" : `${petit(millions)}-millions`,
    );
  }
  if (milliers) {
    morceaux.push(milliers === 1 ? "mille" : `${petit(milliers)}-mille`);
  }
  if (reste) morceaux.push(petit(reste));
  return morceaux.join("-");
}
