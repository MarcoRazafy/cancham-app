import { parseISO, today } from "@/lib/format";
import type { Member, MemberStatus } from "@/lib/types";

/**
 * Règles d'adhésion — le cœur du produit.
 *
 * L'accès à l'application est conditionné par le paiement de la cotisation.
 * C'est le modèle économique de la chambre, encodé ici.
 *
 * Ces fonctions sont volontairement PURES et SANS ÉTAT : le retard est
 * recalculé à la volée à partir de `retardDepuis`, jamais stocké. Il n'y a donc
 * aucun job nocturne à faire tourner pour « passer les membres en retard », et
 * aucune désynchronisation possible entre le statut affiché et la réalité.
 */

/**
 * Photos par produit, au plus.
 *
 * Assez pour montrer un produit sous plusieurs angles ; au-delà, la galerie
 * s'étire et chaque fiche pèse plus lourd à charger depuis Madagascar.
 */
export const PHOTOS_PAR_PRODUIT = 5;

/** Au-delà de ce nombre de jours de retard, l'accès est coupé automatiquement. */
export const RETARD_BLOCAGE_JOURS = 30;

/**
 * Échéance du renouvellement annuel. La cotisation suit l'année civile : les
 * factures « Cotisation annuelle » sont émises en janvier, pour tous.
 */
export const ECHEANCE_COTISATION = { mois: 1, jour: 31 };

/** Délai de règlement d'une facture émise, en jours. */
export const DELAI_REGLEMENT_JOURS = 30;

/**
 * Formules d'adhésion, recopiées de la fiche d'inscription de la chambre.
 *
 * Elles remplacent une cotisation unique de 450 000 Ar, marquée « à confirmer »,
 * qui ne correspondait à aucune d'elles. Le montant dépend du pays et du profil ;
 * deux formules se règlent en dollars canadiens, ce qui interdit de continuer à
 * tout compter en Ariary.
 */
export type FormuleId =
  | "mg_consultant"
  | "mg_entreprise"
  | "ca_diaspora"
  | "ca_entreprise"
  | "sur_mesure";

export type Devise = "MGA" | "CAD";

export interface Formule {
  /** Premier terme du libellé : le pays, ou « Sur mesure ». */
  pays: string;
  /** Profil de l'adhérent. */
  profil: string;
  /** Cotisation annuelle, en unités entières de la devise. */
  montant: number;
  devise: Devise;
}

export const FORMULES: Record<FormuleId, Formule> = {
  mg_consultant: {
    pays: "Madagascar",
    profil: "Consultant, groupement et ONG",
    montant: 250_000,
    devise: "MGA",
  },
  mg_entreprise: {
    pays: "Madagascar",
    profil: "Entreprise",
    montant: 500_000,
    devise: "MGA",
  },
  ca_diaspora: {
    pays: "Canada",
    profil: "Diaspora & travailleur autonome",
    montant: 100,
    devise: "CAD",
  },
  ca_entreprise: {
    pays: "Canada",
    profil: "Entreprise canadienne",
    montant: 300,
    devise: "CAD",
  },
  sur_mesure: {
    pays: "Sur mesure",
    profil: "Partenaire & sponsor",
    montant: 1_000,
    devise: "CAD",
  },
};

/**
 * Ordre d'affichage : celui de la fiche d'inscription.
 *
 * Dérivé des clés de `FORMULES` plutôt que recopié : une formule ajoutée à la
 * grille apparaît d'office dans les formulaires, sans liste parallèle à tenir.
 */
export const ORDRE_FORMULES = Object.keys(FORMULES) as FormuleId[];

/** « Madagascar — Entreprise ». */
export function libelleFormule(id: FormuleId): string {
  const f = FORMULES[id];
  return `${f.pays} — ${f.profil}`;
}

/**
 * Montant dans sa devise, écrit comme sur la fiche de la chambre :
 * « 250 000 Ar », « 100 $ ».
 */
export function fmtMontant(montant: number, devise: Devise): string {
  const nombre = montant.toLocaleString("fr-FR");
  return devise === "CAD" ? `${nombre} $` : `${nombre} Ar`;
}

/** Cotisation annuelle d'une formule, mise en forme. */
export function fmtCotisation(id: FormuleId): string {
  const f = FORMULES[id];
  return fmtMontant(f.montant, f.devise);
}

/**
 * Pages accessibles même quand l'accès est restreint.
 *
 * Un membre bloqué doit pouvoir régulariser sa situation et joindre l'équipe :
 * sa fiche, ses cotisations, et la page de contact — c'est précisément lui qui
 * en a le plus besoin. Une seule liste, lue par `proxy.ts` pour le verrou et
 * par le menu pour les cadenas : deux copies finiraient par diverger.
 */
export const PAGES_TOUJOURS_OUVERTES = [
  "/membre/profil",
  "/membre/cotisations",
  "/membre/contact",
  "/membre/aide",
];

/** Statuts pour lesquels l'adhésion n'est pas encore effective. */
export const ADHESION_PENDING: MemberStatus[] = ["candidature", "en_attente"];

/** Nombre de jours écoulés depuis la bascule en retard. 0 si le membre est à jour. */
export function joursDeRetard(m: Member | null | undefined): number {
  if (!m?.retardDepuis) return 0;
  const diff = today().getTime() - parseISO(m.retardDepuis).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

/** Vrai si le retard dépasse le seuil de blocage automatique. */
export function retardBloque(m: Member | null | undefined): boolean {
  return (
    !!m && m.statut === "en_retard" && joursDeRetard(m) > RETARD_BLOCAGE_JOURS
  );
}

/**
 * Vrai si le membre est restreint à son seul profil.
 *
 * Attention à la nuance : un membre en retard de moins de 30 jours conserve
 * l'intégralité de ses accès, il est seulement averti. On prévient avant de
 * couper.
 */
export function isAccessLocked(m: Member | null | undefined): boolean {
  if (!m) return false;
  return ADHESION_PENDING.includes(m.statut) || retardBloque(m);
}

/** Raison du verrouillage, pour choisir le bandeau à afficher. */
export type LockReason = "adhesion_en_attente" | "retard_bloquant" | null;

export function lockReason(m: Member | null | undefined): LockReason {
  if (!m) return null;
  if (ADHESION_PENDING.includes(m.statut)) return "adhesion_en_attente";
  if (retardBloque(m)) return "retard_bloquant";
  return null;
}

/** Vrai si le membre est en retard mais pas encore bloqué : période d'avertissement. */
export function isOverdueWarning(m: Member | null | undefined): boolean {
  return !!m && m.statut === "en_retard" && !retardBloque(m);
}
