import { ajouterJours, enMinutes, estHeure } from "@/lib/agenda";

/**
 * Créneaux de rendez-vous : le calcul, sans base ni réseau.
 *
 * L'équipe déclare ses plages d'accueil par jour de semaine ; un type de
 * rendez-vous porte sa durée. Le découpage en créneaux se déduit des deux,
 * moins ce qui est déjà pris, moins ce qui est trop proche.
 *
 * Tout se raisonne en heure de Madagascar, celle de la chambre : les plages y
 * sont déclarées, et c'est là qu'on se rencontre. Un membre de la diaspora
 * doit donc lire l'heure malgache, affichée comme telle.
 */

/** Fuseau de la chambre : Antananarivo, UTC+3, sans heure d'été. */
export const FUSEAU_CHAMBRE = "+03:00";

/** Ce que l'équipe annonce, pour que personne ne se trompe d'heure. */
export const MENTION_FUSEAU = "heure de Madagascar (UTC+3)";

/**
 * Délai minimal avant un rendez-vous, en heures. En deçà, le créneau ne
 * s'offre plus : personne ne prépare un entretien en dix minutes.
 */
export const DELAI_PREVENANCE_H = 4;

/** Jours ouverts à la réservation à partir d'aujourd'hui. */
export const HORIZON_JOURS = 30;

/** Les jours de la semaine, du lundi au dimanche (norme ISO : 1 à 7). */
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
  /** 1 = lundi … 7 = dimanche. */
  jour: number;
  /** « HH:MM ». */
  debut: string;
  fin: string;
}

/** Un rendez-vous déjà pris, qui retire son créneau de la liste. */
export interface Occupe {
  debut: string;
  fin: string;
}

/** Jour de la semaine d'une date ISO, en norme ISO : lundi = 1. */
export function jourSemaine(iso: string): number {
  const d = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

/** « 09:00 » à partir d'un nombre de minutes depuis minuit. */
export function versHeure(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** L'heure de fin d'un créneau, sa durée ajoutée. */
export const finCreneau = (debut: string, duree: number) =>
  versHeure(enMinutes(debut) + duree);

/** Deux plages horaires se chevauchent-elles ? Se toucher ne compte pas. */
export function chevauche(a: Occupe, b: Occupe): boolean {
  return (
    enMinutes(a.debut) < enMinutes(b.fin) &&
    enMinutes(b.debut) < enMinutes(a.fin)
  );
}

/**
 * Les créneaux libres d'un jour.
 *
 * Un créneau démarre au début d'une plage et s'enchaîne de sa durée : une
 * plage de 9 h à 12 h en rendez-vous de quarante-cinq minutes en donne quatre,
 * et les quinze dernières minutes restent vides plutôt que d'offrir un
 * rendez-vous qui déborderait.
 */
export function creneauxLibres({
  jour,
  plages,
  duree,
  occupes = [],
  maintenant,
}: {
  /** Jour visé, ISO court. */
  jour: string;
  /** Toutes les plages déclarées, tous jours confondus. */
  plages: Plage[];
  /** Durée du rendez-vous, en minutes. */
  duree: number;
  occupes?: Occupe[];
  /**
   * Instant présent, en millisecondes. Les créneaux trop proches sont
   * retirés. Absent : aucun filtre de temps — utile pour un aperçu.
   */
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
  // Deux plages peuvent se recouvrir : un créneau ne s'offre qu'une fois.
  return [...new Set(creneaux)].sort();
}

/**
 * Les jours qu'on peut proposer : ceux où l'équipe reçoit, dans l'horizon
 * ouvert à la réservation. Les jours sans plage n'apparaissent pas.
 */
export function joursOuverts(depuis: string, plages: Plage[]): string[] {
  const ouverts = new Set(plages.map((p) => p.jour));
  const jours: string[] = [];
  for (let i = 0; i < HORIZON_JOURS; i++) {
    const jour = ajouterJours(depuis, i);
    if (ouverts.has(jourSemaine(jour))) jours.push(jour);
  }
  return jours;
}
