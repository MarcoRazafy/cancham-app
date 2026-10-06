import type { CSSProperties } from "react";
import { COORDONNEES } from "@/lib/coordonnees";

/**
 * Ce que la page « La Traversée » — le Gala des 10 ans — sait de l'événement.
 *
 * Un seul fichier à modifier le jour où la chambre fixe un horaire, change
 * de salle ou ajuste le tarif. Rien ici n'est inventé : ce qui n'est pas
 * encore décidé est marqué « à confirmer » dans la page.
 *
 * Sans `server-only` : le compte à rebours et les lots tournent dans le
 * navigateur et lisent ces valeurs.
 */
export const EVENEMENT = {
  nom: "La Traversée",
  /** Ouverture des portes du gala, heure de Madagascar. */
  dateGala: "2026-12-18T19:00:00+03:00",
  dateLisible: "Vendredi 18 décembre 2026",
  lieu: "CCI Ivato, Antananarivo",
  lieuCourt: "CCI Ivato",
  /**
   * Tarif du pass, en Ariary — à défaut de la fiche de l'événement : dès
   * qu'elle existe, c'est son tarif public qui s'affiche (voir la page).
   */
  prixPass: 500_000,
  /** Dotation de chacun des deux défis photo, en Ariary. */
  prixDefi: 5_000_000,
  ambassadeurs: "Shyn et Denise",
} as const;

/** Où mènent les boutons qui ne dépendent pas de la fiche de l'événement. */
export const LIENS = {
  /**
   * La plateforme n'a pas de page de dons : « Soutenir le projet » ouvre un
   * courriel à la chambre, l'objet déjà écrit. Le jour où une page existe,
   * une seule ligne change.
   */
  dons: `mailto:${COORDONNEES.email}?subject=${encodeURIComponent(
    "Soutenir Hope for a Better Life — La Traversée",
  )}`,
  rendezVous: "https://tidycal.com/andohn/entretien-cancham",
} as const;

/**
 * Où réserver : la fiche publique de l'événement, qui porte l'inscription et
 * le paiement. Tant que la chambre ne l'a pas créée, les rendez-vous de la
 * vitrine — plutôt qu'un bouton mort.
 */
export function lienBilletterie(evenementId: string | null): string {
  return evenementId ? `/evenements/${evenementId}` : "/#evenements";
}

/**
 * Retard d'un élément dans une cascade d'apparitions (voir traversee.css).
 *
 * Les cartes d'une rangée entrent l'une après l'autre : la suivante part
 * quelques dizaines de millisecondes après la précédente. Le même que celui
 * de la vitrine (CadreVitrine.tsx), redit ici pour que les composants qui
 * tournent dans le navigateur n'importent rien du serveur.
 */
export const retard = (ms: number): CSSProperties =>
  ({ "--retard": `${ms}ms` }) as CSSProperties;
