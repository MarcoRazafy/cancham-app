import type { CSSProperties } from "react";
import { COORDONNEES } from "@/lib/coordonnees";

export const EVENEMENT = {
  nom: "La Traversée",
  dateGala: "2026-12-18T19:00:00+03:00",
  dateLisible: "Vendredi 18 décembre 2026",
  lieu: "CCI Ivato, Antananarivo",
  lieuCourt: "CCI Ivato",
  prixPass: 500_000,
  prixDefi: 5_000_000,
  ambassadeurs: "Shyn et Denise",
} as const;

export const LIENS = {
  dons: `mailto:${COORDONNEES.email}?subject=${encodeURIComponent(
    "Soutenir Hope for a Better Life — La Traversée",
  )}`,
  rendezVous: "https://tidycal.com/andohn/entretien-cancham",
} as const;

export function lienBilletterie(evenementId: string | null): string {
  return evenementId ? `/evenements/${evenementId}` : "/#evenements";
}

export const retard = (ms: number): CSSProperties =>
  ({ "--retard": `${ms}ms` }) as CSSProperties;
