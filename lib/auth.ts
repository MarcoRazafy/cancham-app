import "server-only";

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export { hacher, MOT_DE_PASSE_MIN, verifier } from "@/lib/mots-de-passe";

/**
 * Session : cookie signé.
 *
 * HMAC-SHA256 de la bibliothèque standard de Node, aucune dépendance. Les
 * empreintes de mots de passe vivent dans `lib/mots-de-passe.ts`, réutilisable
 * hors de l'application.
 *
 * Le cookie ne contient qu'un identifiant, une date d'expiration et leur
 * signature : rien qu'un visiteur puisse forger ou modifier sans la clé.
 */

const COOKIE = "cancham_session";
/** Un mois : assez pour ne pas se reconnecter à chaque visite. */
const DUREE_JOURS = 30;

/**
 * Clé de signature des sessions.
 *
 * En production elle vient de l'environnement : sans elle, n'importe qui
 * pourrait fabriquer un cookie valide. En développement, une valeur fixe
 * évite d'avoir à configurer quoi que ce soit — les sessions ne survivent de
 * toute façon pas à un changement de clé.
 */
function cle(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET manquant : définissez-le pour signer les sessions.",
    );
  }
  return "cancham-developpement-uniquement";
}

/* ============================ Session ============================ */

const signer = (charge: string) =>
  createHmac("sha256", cle()).update(charge).digest("base64url");

/**
 * Ouvre une session : dépose le cookie signé.
 *
 * Sans « se souvenir de moi », le cookie n'a pas de date d'expiration : il
 * disparaît à la fermeture du navigateur. Sur un poste partagé, c'est ce qu'on
 * attend.
 */
export async function ouvrirSession(
  userId: string,
  souvenir = true,
): Promise<void> {
  const expire = Date.now() + DUREE_JOURS * 86_400_000;
  const charge = `${userId}.${expire}`;
  (await cookies()).set(COOKIE, `${charge}.${signer(charge)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(souvenir ? { maxAge: DUREE_JOURS * 86_400 } : {}),
  });
}

export async function fermerSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export interface Session {
  userId: string;
  /** Ouverture de la session, en millisecondes. */
  emiseLe: number;
}

/** La session de la personne connectée, ou `null`. */
export async function sessionCourante(): Promise<Session | null> {
  return lireSession((await cookies()).get(COOKIE)?.value);
}

/**
 * Une session ouverte avant le dernier changement de mot de passe ne vaut
 * plus rien : c'est ce qui met dehors quelqu'un qui se serait connecté avec
 * l'ancien. Une seconde de marge couvre l'ouverture de session qui suit
 * aussitôt le changement.
 */
export function sessionPerimee(
  session: Session,
  motDePasseModifieLe: Date | null,
): boolean {
  return (
    motDePasseModifieLe !== null &&
    session.emiseLe + 1000 < motDePasseModifieLe.getTime()
  );
}

/**
 * Lecture d'un jeton de session, utilisable hors des composants serveur —
 * le proxy lit le cookie sur la requête.
 */
export function lireSession(jeton: string | undefined): Session | null {
  if (!jeton) return null;
  const separateur = jeton.lastIndexOf(".");
  if (separateur < 0) return null;

  const charge = jeton.slice(0, separateur);
  const signature = jeton.slice(separateur + 1);
  const attendue = signer(charge);
  if (
    signature.length !== attendue.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(attendue))
  ) {
    return null;
  }

  const [userId, expire] = charge.split(".");
  if (!userId || !expire || Number(expire) < Date.now()) return null;
  // Le cookie porte son expiration ; son ouverture s'en déduit.
  return { userId, emiseLe: Number(expire) - DUREE_JOURS * 86_400_000 };
}

export const NOM_COOKIE = COOKIE;
