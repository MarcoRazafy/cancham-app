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

/** Au-delà de ce nombre de jours de retard, l'accès est coupé automatiquement. */
export const RETARD_BLOCAGE_JOURS = 30;

/** Cotisation annuelle, en Ariary. À confirmer auprès de la chambre. */
export const COTISATION_ANNUELLE = 450_000;

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
  return !!m && m.statut === "en_retard" && joursDeRetard(m) > RETARD_BLOCAGE_JOURS;
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
