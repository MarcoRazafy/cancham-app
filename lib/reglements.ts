import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  COORDONNEES_VIDES,
  modeDisponible,
  ORDRE_MODES,
  type Coordonnees,
  type ModeReglement,
} from "@/lib/modes-reglement";
import { vanillaPayActif } from "@/lib/vanillapay";

/**
 * Les moyens de règlement, côté serveur.
 *
 * La liste elle-même vit dans `lib/modes-reglement.ts`, sans dépendance au
 * serveur : les fenêtres de saisie en ont besoin dans le navigateur. Ici, ce
 * qui touche à la base ou au hasard.
 */
export * from "@/lib/modes-reglement";
export { estPortefeuilleConnu } from "@/lib/portefeuilles";

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
  if (!c) return COORDONNEES_VIDES;
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
 * Les moyens proposables en l'état : coordonnées saisies et prestataire
 * branché. Une seule définition, pour que la fenêtre d'inscription et la
 * page des factures n'offrent jamais deux listes différentes.
 */
export async function modesProposes(): Promise<ModeReglement[]> {
  const c = await getCoordonneesPaiement();
  const enLigne = vanillaPayActif();
  return ORDRE_MODES.filter((m) => modeDisponible(m, c, enLigne));
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
