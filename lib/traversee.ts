import { COORDONNEES } from "@/lib/coordonnees";

export const EVENEMENT = {
  nom: "La Traversée",
  dateGala: "2026-12-18T19:00:00+03:00",
  dateLisible: "Vendredi 18 décembre 2026",
  lieu: "Hôtel Carlton, Antananarivo",
  lieuCourt: "Hôtel Carlton",
  prixPass: 500_000,
  lotTombola: 3_000_000,
} as const;

export const LIENS = {
  equipe: `mailto:${COORDONNEES.email}?subject=${encodeURIComponent(
    "La Traversée : réservation en équipe",
  )}`,
} as const;

export function lienBilletterie(evenementId: string | null): string {
  return evenementId ? `/evenements/${evenementId}` : "/#evenements";
}

export interface Decompte {
  j: number;
  h: number;
  m: number;
  s: number;
}

export function decompte(maintenant = Date.now()): Decompte {
  const reste = Math.max(
    0,
    Math.floor((new Date(EVENEMENT.dateGala).getTime() - maintenant) / 1000),
  );
  return {
    j: Math.floor(reste / 86400),
    h: Math.floor((reste % 86400) / 3600),
    m: Math.floor((reste % 3600) / 60),
    s: reste % 60,
  };
}
