import { ajouterJours, enMinutes, estHeure } from "@/lib/agenda";

export const FUSEAU_CHAMBRE = "+03:00";

export const MENTION_FUSEAU = "heure de Madagascar (UTC+3)";

export const DELAI_PREVENANCE_H = 4;

export const HORIZON_JOURS = 30;

export const JOURS_SEMAINE: { cle: number; libelle: string }[] = [
  { cle: 1, libelle: "Lundi" },
  { cle: 2, libelle: "Mardi" },
  { cle: 3, libelle: "Mercredi" },
  { cle: 4, libelle: "Jeudi" },
  { cle: 5, libelle: "Vendredi" },
  { cle: 6, libelle: "Samedi" },
  { cle: 7, libelle: "Dimanche" },
];

export interface Plage {
  jour: number;
  debut: string;
  fin: string;
}

export interface Occupe {
  debut: string;
  fin: string;
}

export function jourSemaine(iso: string): number {
  const d = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

export function versHeure(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const finCreneau = (debut: string, duree: number) =>
  versHeure(enMinutes(debut) + duree);

export function chevauche(a: Occupe, b: Occupe): boolean {
  return (
    enMinutes(a.debut) < enMinutes(b.fin) &&
    enMinutes(b.debut) < enMinutes(a.fin)
  );
}

export function creneauxLibres({
  jour,
  plages,
  duree,
  occupes = [],
  maintenant,
}: {
  jour: string;
  plages: Plage[];
  duree: number;
  occupes?: Occupe[];
  maintenant?: number;
}): string[] {
  if (duree <= 0) return [];
  const duJour = plages.filter(
    (p) => p.jour === jourSemaine(jour) && estHeure(p.debut) && estHeure(p.fin),
  );

  const limite =
    maintenant === undefined
      ? null
      : maintenant + DELAI_PREVENANCE_H * 60 * 60 * 1000;

  const creneaux: string[] = [];
  for (const plage of duJour) {
    const fin = enMinutes(plage.fin);
    for (let m = enMinutes(plage.debut); m + duree <= fin; m += duree) {
      const debut = versHeure(m);
      const creneau = { debut, fin: versHeure(m + duree) };
      if (occupes.some((o) => chevauche(creneau, o))) continue;
      if (limite !== null) {
        const quand = Date.parse(`${jour}T${debut}:00${FUSEAU_CHAMBRE}`);
        if (quand < limite) continue;
      }
      creneaux.push(debut);
    }
  }
  return [...new Set(creneaux)].sort();
}

export function joursOuverts(depuis: string, plages: Plage[]): string[] {
  const ouverts = new Set(plages.map((p) => p.jour));
  const jours: string[] = [];
  for (let i = 0; i < HORIZON_JOURS; i++) {
    const jour = ajouterJours(depuis, i);
    if (ouverts.has(jourSemaine(jour))) jours.push(jour);
  }
  return jours;
}
