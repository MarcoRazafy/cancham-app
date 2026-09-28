import "server-only";
import { cookies } from "next/headers";

/**
 * Le presse-papier de la bibliothèque.
 *
 * Il vit dans un cookie et non dans la page : entre « couper » et « coller
 * ici », l'équipe change de dossier, donc de page rendue côté serveur. Un
 * état gardé dans le navigateur ne survivrait pas à cette navigation.
 *
 * Il ne contient que des identifiants et un mode — rien de sensible, et rien
 * qu'un membre ne puisse déjà voir. Sa durée est courte : un presse-papier
 * oublié d'une semaine ferait coller n'importe quoi n'importe où.
 */

const COOKIE = "cancham_presse_papier";
const DUREE_MINUTES = 60;

export type ModePressePapier = "copier" | "couper";

export interface PressePapier {
  mode: ModePressePapier;
  ids: string[];
}

export async function lirePressePapier(): Promise<PressePapier | null> {
  const brut = (await cookies()).get(COOKIE)?.value;
  if (!brut) return null;
  try {
    const v = JSON.parse(brut) as PressePapier;
    if (v.mode !== "copier" && v.mode !== "couper") return null;
    if (!Array.isArray(v.ids) || !v.ids.length) return null;
    return { mode: v.mode, ids: v.ids.filter((x) => typeof x === "string") };
  } catch {
    return null;
  }
}

export async function poserPressePapier(v: PressePapier): Promise<void> {
  (await cookies()).set(COOKIE, JSON.stringify(v), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_MINUTES * 60,
  });
}

export async function viderPressePapier(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
