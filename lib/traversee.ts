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

export const PLATEFORME_PAR_DEFAUT = "https://impact261.com";

export function basePlateforme(valeur?: string | null): string {
  const saisie = valeur?.trim().replace(/\/+$/, "");
  if (!saisie) return PLATEFORME_PAR_DEFAUT;
  try {
    const url = new URL(saisie);
    return url.protocol === "https:" ? url.origin : PLATEFORME_PAR_DEFAUT;
  } catch {
    return PLATEFORME_PAR_DEFAUT;
  }
}

export const CHAMPS_RESERVATION = [
  "nom",
  "prenom",
  "entreprise",
  "role",
  "email",
  "telephone",
] as const;

export type ChampReservation = (typeof CHAMPS_RESERVATION)[number];

export type Reservation = Record<ChampReservation, string>;

const MANQUANT: Record<ChampReservation, string> = {
  nom: "Indiquez votre nom.",
  prenom: "Indiquez votre prénom.",
  entreprise: "Indiquez votre entreprise.",
  role: "Indiquez votre rôle ou votre fonction.",
  email: "Indiquez votre adresse e-mail.",
  telephone: "Indiquez votre numéro de téléphone.",
};

export function emailValide(saisie: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(saisie.trim());
}

export function telephoneNormalise(saisie: string): string | null {
  const brut = saisie.trim();
  if (!/^\+?[\d\s().-]+$/.test(brut)) return null;
  const chiffres = brut.replace(/\D/g, "");
  if (chiffres.length < 7 || chiffres.length > 15) return null;
  return `${brut.startsWith("+") ? "+" : ""}${chiffres}`;
}

export function verifierReservation(
  brut: Partial<Record<ChampReservation, unknown>>,
):
  | { ok: true; valeurs: Reservation }
  | { ok: false; erreurs: Partial<Record<ChampReservation, string>> } {
  const valeurs = Object.fromEntries(
    CHAMPS_RESERVATION.map((c) => [
      c,
      String(brut[c] ?? "")
        .trim()
        .replace(/\s+/g, " "),
    ]),
  ) as Reservation;
  const erreurs: Partial<Record<ChampReservation, string>> = {};
  for (const c of CHAMPS_RESERVATION) {
    if (!valeurs[c]) erreurs[c] = MANQUANT[c];
  }
  if (valeurs.email && !emailValide(valeurs.email)) {
    erreurs.email = "Cette adresse e-mail n’est pas valide.";
  }
  const telephone = valeurs.telephone
    ? telephoneNormalise(valeurs.telephone)
    : null;
  if (valeurs.telephone && !telephone) {
    erreurs.telephone =
      "Numéro invalide : au moins 7 chiffres, le + est accepté.";
  }
  if (Object.keys(erreurs).length) return { ok: false, erreurs };
  return { ok: true, valeurs: { ...valeurs, telephone: telephone ?? "" } };
}

export function adresseInscription(plateforme: string, r: Reservation): string {
  const parametres: [string, string][] = [
    ["prenom", r.prenom],
    ["nom", r.nom],
    ["entreprise", r.entreprise],
    ["role", r.role],
    ["email", r.email],
    ["telephone", r.telephone],
  ];
  return `${basePlateforme(plateforme)}/inscription?${parametres
    .map(([cle, valeur]) => `${cle}=${encodeURIComponent(valeur)}`)
    .join("&")}`;
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
