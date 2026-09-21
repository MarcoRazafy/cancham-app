import {
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/**
 * Empreintes de mots de passe.
 *
 * scrypt vient de la bibliothèque standard de Node : une dépendance de moins
 * à suivre, et il est précisément conçu pour résister aux attaques par force
 * brute sur du matériel spécialisé.
 *
 * Module séparé de `lib/auth.ts`, qui est réservé au serveur Next : le seed et
 * les scripts doivent pouvoir hacher un mot de passe hors de l'application.
 */

const COUT = 16_384; // paramètre N de scrypt
const LONGUEUR = 64;

/** Longueur minimale d'un mot de passe, à l'inscription. */
export const MOT_DE_PASSE_MIN = 8;

/** Empreinte scrypt, sel compris : « scrypt$sel$empreinte ». */
export function hacher(motDePasse: string): string {
  const sel = randomBytes(16).toString("hex");
  const empreinte = scryptSync(motDePasse, sel, LONGUEUR, { N: COUT });
  return `scrypt$${sel}$${empreinte.toString("hex")}`;
}

/**
 * Vérifie un mot de passe contre son empreinte.
 *
 * La comparaison passe par `timingSafeEqual` : une comparaison ordinaire
 * s'arrête au premier octet différent, et ce temps de réponse renseigne un
 * attaquant sur ce qu'il a deviné.
 */
export function verifier(motDePasse: string, stocke: string | null): boolean {
  if (!stocke) return false;
  const [algo, sel, empreinte] = stocke.split("$");
  if (algo !== "scrypt" || !sel || !empreinte) return false;
  const attendu = Buffer.from(empreinte, "hex");
  const calcule = scryptSync(motDePasse, sel, attendu.length, { N: COUT });
  return attendu.length === calcule.length && timingSafeEqual(attendu, calcule);
}

/** Signes d'un mot de passe provisoire : ni O/0, ni l/1/I, qui se confondent. */
const SIGNES_PROVISOIRES =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/**
 * Mot de passe provisoire d'un compte créé par l'équipe, envoyé par e-mail :
 * trois groupes de quatre signes, « Kc7m-Pq2x-Rt9w ». Facile à recopier,
 * long assez pour ne pas se deviner ; son titulaire le change ensuite.
 */
export function motDePasseProvisoire(): string {
  return Array.from({ length: 3 }, () =>
    Array.from(
      { length: 4 },
      () => SIGNES_PROVISOIRES[randomInt(SIGNES_PROVISOIRES.length)],
    ).join(""),
  ).join("-");
}
