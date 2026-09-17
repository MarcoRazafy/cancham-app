import {
  DELAI_REGLEMENT_JOURS,
  ECHEANCE_COTISATION,
  RETARD_BLOCAGE_JOURS,
} from "@/lib/membership";

/**
 * Agenda du membre : calendrier, heures et échéances.
 *
 * Tout se calcule sur des dates ISO courtes (YYYY-MM-DD), en arithmétique UTC,
 * plutôt que sur des dates locales : une journée n'a pas de fuseau, et une
 * grille de mois ne doit pas glisser d'une case selon l'heure du serveur ou du
 * navigateur. Aucune dépendance au serveur : les composants client s'en
 * servent aussi.
 */

export type VueAgenda = "mois" | "semaine" | "liste";

export const VUES_AGENDA: { cle: VueAgenda; libelle: string }[] = [
  { cle: "mois", libelle: "Mois" },
  { cle: "semaine", libelle: "Semaine" },
  { cle: "liste", libelle: "À venir" },
];

export type TypeElement = "evenement" | "inscription" | "echeance" | "rappel";

export const TYPES_ELEMENT: { cle: TypeElement; libelle: string }[] = [
  { cle: "evenement", libelle: "Événements" },
  { cle: "inscription", libelle: "Mes inscriptions" },
  { cle: "echeance", libelle: "Échéances" },
  { cle: "rappel", libelle: "Rappels" },
];

export interface ElementAgenda {
  /** Unique dans l'agenda : préfixé par le type. */
  id: string;
  type: TypeElement;
  titre: string;
  /** ISO court. */
  jour: string;
  /** « HH:MM ». `null` = toute la journée. */
  debut: string | null;
  fin: string | null;
  lieu?: string | null;
  /** Précision affichée sous le titre : format, montant… */
  detail?: string | null;
  /** Page de l'élément. `null` pour un rappel, qui se gère sur place. */
  href: string | null;
  /** Échéance dépassée sans règlement. */
  urgent?: boolean;
  /** Rappel coché, ou échéance réglée. */
  fait?: boolean;
  /** Ce qu'il faut pour modifier un rappel. */
  rappel?: { id: string; note: string | null };
}

/** Nombre de jours couverts par la vue « À venir ». */
export const JOURS_LISTE = 60;

/* ============================ Jours ============================ */

const versDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const versISO = (d: Date) => d.toISOString().slice(0, 10);
const deux = (n: number) => String(n).padStart(2, "0");

/** Vrai pour une date ISO courte qui existe (« 2026-02-30 » est refusée). */
export function estJourISO(v: string | null | undefined): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && versISO(versDate(v)) === v;
}

export function ajouterJours(iso: string, n: number): string {
  const d = versDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return versISO(d);
}

/** Écart en jours de `a` à `b` : positif si `b` est après `a`. */
export function ecartJours(a: string, b: string): number {
  return Math.round(
    (versDate(b).getTime() - versDate(a).getTime()) / 86_400_000,
  );
}

export const debutMois = (iso: string) => `${iso.slice(0, 7)}-01`;

export function ajouterMois(iso: string, n: number): string {
  const d = versDate(debutMois(iso));
  d.setUTCMonth(d.getUTCMonth() + n);
  return versISO(d);
}

export const finMois = (iso: string) => ajouterJours(ajouterMois(iso, 1), -1);

/** Rang dans la semaine, du lundi (0) au dimanche (6). */
export const rangSemaine = (iso: string) => (versDate(iso).getUTCDay() + 6) % 7;

export const debutSemaine = (iso: string) =>
  ajouterJours(iso, -rangSemaine(iso));

export function joursSemaine(iso: string): string[] {
  const lundi = debutSemaine(iso);
  return Array.from({ length: 7 }, (_, i) => ajouterJours(lundi, i));
}

/** Les semaines complètes, du lundi au dimanche, qui couvrent le mois. */
export function grilleMois(iso: string): string[][] {
  const fin = finMois(iso);
  const semaines: string[][] = [];
  for (let l = debutSemaine(debutMois(iso)); l <= fin; l = ajouterJours(l, 7)) {
    semaines.push(joursSemaine(l));
  }
  return semaines;
}

/** Les jours à charger pour une vue. */
export function periodeVue(
  vue: VueAgenda,
  iso: string,
): { du: string; au: string } {
  if (vue === "semaine") {
    const lundi = debutSemaine(iso);
    return { du: lundi, au: ajouterJours(lundi, 6) };
  }
  if (vue === "liste")
    return { du: iso, au: ajouterJours(iso, JOURS_LISTE - 1) };
  const grille = grilleMois(iso);
  return { du: grille[0][0], au: grille.at(-1)![6] };
}

/** La date de la période précédente (`sens` = -1) ou suivante (+1). */
export function periodeVoisine(
  vue: VueAgenda,
  iso: string,
  sens: 1 | -1,
): string {
  if (vue === "mois") return ajouterMois(iso, sens);
  if (vue === "semaine") return ajouterJours(debutSemaine(iso), 7 * sens);
  return ajouterJours(iso, JOURS_LISTE * sens);
}

/** Date lisible en français. Le fuseau UTC garde le jour tel qu'il est écrit. */
export function fmtJour(
  iso: string,
  opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  const texte = versDate(iso).toLocaleDateString("fr-FR", {
    ...opts,
    timeZone: "UTC",
  });
  // « 1er octobre », pas « 1 octobre ».
  return opts.day && iso.endsWith("-01") && opts.month
    ? texte.replace(/(^|\s)1(?=\s)/, "$11er")
    : texte;
}

const majuscule = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/** « Septembre 2026 », « 14 – 20 sept. 2026 », « Du 17 sept. au 15 nov. 2026 ». */
export function libellePeriode(vue: VueAgenda, iso: string): string {
  if (vue === "mois") {
    return majuscule(fmtJour(iso, { month: "long", year: "numeric" }));
  }
  const { du, au } = periodeVue(vue, iso);
  const memeAnnee = du.slice(0, 4) === au.slice(0, 4);
  const memeMois = du.slice(0, 7) === au.slice(0, 7);
  const debut = memeMois
    ? fmtJour(du, { day: "numeric" })
    : fmtJour(du, {
        day: "numeric",
        month: "short",
        ...(memeAnnee ? {} : { year: "numeric" }),
      });
  const fin = fmtJour(au, { day: "numeric", month: "short", year: "numeric" });
  return vue === "semaine" ? `${debut} – ${fin}` : `Du ${debut} au ${fin}`;
}

/** « Aujourd'hui », « Demain », « Hier », sinon « Mardi 22 septembre ». */
export function jourRelatif(iso: string, aujourdhui: string): string {
  const ecart = ecartJours(aujourdhui, iso);
  if (ecart === 0) return "Aujourd’hui";
  if (ecart === 1) return "Demain";
  if (ecart === -1) return "Hier";
  return majuscule(
    fmtJour(iso, {
      weekday: "long",
      day: "numeric",
      month: "long",
      ...(iso.slice(0, 4) === aujourdhui.slice(0, 4)
        ? {}
        : { year: "numeric" }),
    }),
  );
}

/* ============================ Heures ============================ */

/** Vrai pour une heure « HH:MM » valide. */
export function estHeure(v: string | null | undefined): v is string {
  return !!v && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}

export function enMinutes(heure: string): number {
  const [h, m] = heure.split(":").map(Number);
  return h * 60 + m;
}

/** « 17:30 » → « 17 h 30 ». */
export const fmtHeure = (heure: string) => heure.replace(":", " h ");

/** « 17 h 30 – 20 h 00 », « 17 h 30 », ou `null` pour toute la journée. */
export function plageHoraire(
  debut: string | null | undefined,
  fin: string | null | undefined,
): string | null {
  if (!debut) return null;
  return fin ? `${fmtHeure(debut)} – ${fmtHeure(fin)}` : fmtHeure(debut);
}

/* ============================ Échéances ============================ */

/** Date limite de règlement d'une facture émise le `dateISO`. */
export const echeanceFacture = (dateISO: string) =>
  ajouterJours(dateISO, DELAI_REGLEMENT_JOURS);

/** Échéance du renouvellement de la cotisation d'une année. */
export const echeanceCotisation = (annee: number) =>
  `${annee}-${deux(ECHEANCE_COTISATION.mois)}-${deux(ECHEANCE_COTISATION.jour)}`;

/** Une facture de cotisation, reconnue à son objet — comme au règlement. */
export const estFactureCotisation = (objet: string) =>
  /^cotisation/i.test(objet);

/** Années dont la cotisation est réglée, d'après les factures payées. */
export function anneesCotisationReglees(
  factures: { date: string; objet: string; statut: string }[],
): number[] {
  return [
    ...new Set(
      factures
        .filter((f) => f.statut === "payee" && estFactureCotisation(f.objet))
        .map((f) => Number(f.date.slice(0, 4))),
    ),
  ];
}

/**
 * Prochain renouvellement : l'échéance de la première année qui n'est pas
 * réglée, sans remonter avant l'année qui suit l'adhésion — la cotisation
 * versée en adhérant couvre l'année d'entrée.
 *
 * Une échéance passée d'un membre à jour compte comme réglée, même sans
 * facture enregistrée : le statut fait foi.
 */
export function prochaineEcheanceCotisation({
  aujourdhui,
  adhesion,
  anneesReglees,
  aJour,
}: {
  aujourdhui: string;
  adhesion: string;
  anneesReglees: number[];
  aJour: boolean;
}): string {
  let annee = Math.max(
    Number(aujourdhui.slice(0, 4)),
    Number(adhesion.slice(0, 4)) + 1,
  );
  while (
    anneesReglees.includes(annee) ||
    (aJour && echeanceCotisation(annee) < aujourdhui)
  ) {
    annee++;
  }
  return echeanceCotisation(annee);
}

/**
 * Premier jour d'accès restreint pour un membre en retard.
 *
 * L'accès est coupé au-delà de `RETARD_BLOCAGE_JOURS` jours de retard : le
 * lendemain du trentième jour.
 */
export const dateRestriction = (retardDepuis: string) =>
  ajouterJours(retardDepuis, RETARD_BLOCAGE_JOURS + 1);

/* ============================ Tri ============================ */

const ORDRE_TYPES: Record<TypeElement, number> = {
  echeance: 0,
  inscription: 1,
  evenement: 2,
  rappel: 3,
};

/** Par jour, la journée entière d'abord, puis par heure. */
export function trierElements(elements: ElementAgenda[]): ElementAgenda[] {
  return [...elements].sort(
    (a, b) =>
      a.jour.localeCompare(b.jour) ||
      (a.debut ?? "").localeCompare(b.debut ?? "") ||
      ORDRE_TYPES[a.type] - ORDRE_TYPES[b.type] ||
      a.titre.localeCompare(b.titre, "fr"),
  );
}

/** Les éléments rangés par jour, dans l'ordre. */
export function parJour(
  elements: ElementAgenda[],
): Map<string, ElementAgenda[]> {
  const jours = new Map<string, ElementAgenda[]>();
  for (const e of trierElements(elements)) {
    jours.set(e.jour, [...(jours.get(e.jour) ?? []), e]);
  }
  return jours;
}
