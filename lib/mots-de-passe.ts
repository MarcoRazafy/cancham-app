import {
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const COUT = 16_384;
const LONGUEUR = 64;

export const MOT_DE_PASSE_MIN = 8;

export function hacher(motDePasse: string): string {
  const sel = randomBytes(16).toString("hex");
  const empreinte = scryptSync(motDePasse, sel, LONGUEUR, { N: COUT });
  return `scrypt$${sel}$${empreinte.toString("hex")}`;
}

export function verifier(motDePasse: string, stocke: string | null): boolean {
  if (!stocke) return false;
  const [algo, sel, empreinte] = stocke.split("$");
  if (algo !== "scrypt" || !sel || !empreinte) return false;
  const attendu = Buffer.from(empreinte, "hex");
  const calcule = scryptSync(motDePasse, sel, attendu.length, { N: COUT });
  return attendu.length === calcule.length && timingSafeEqual(attendu, calcule);
}

const SIGNES_PROVISOIRES =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function motDePasseProvisoire(): string {
  return Array.from({ length: 3 }, () =>
    Array.from(
      { length: 4 },
      () => SIGNES_PROVISOIRES[randomInt(SIGNES_PROVISOIRES.length)],
    ).join(""),
  ).join("-");
}
