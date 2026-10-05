import { NextResponse } from "next/server";
import { Decalage, VideoRefusee } from "@/lib/videos";

/**
 * Ce que partagent les routes d'envoi d'une vidéo de présentation.
 */

/**
 * La requête vient-elle bien de la plateforme ?
 *
 * Le cookie de session ne suit pas une requête lancée depuis un autre site,
 * et un envoi de ce genre déclenche de toute façon un contrôle préalable du
 * navigateur. Ceci ferme la porte une seconde fois : quand le navigateur dit
 * d'où part la requête, ce doit être d'ici.
 */
export function dIci(requete: Request): boolean {
  const origine = requete.headers.get("origin");
  if (!origine) return true;
  const hote =
    requete.headers.get("x-forwarded-host") ?? requete.headers.get("host");
  try {
    return new URL(origine).host === hote;
  } catch {
    return false;
  }
}

export const refus = (erreur: string, statut: number) =>
  NextResponse.json({ erreur }, { status: statut });

/** Un refus prévu se dit ; le reste remonte comme une panne. */
export function reponseDErreur(e: unknown): NextResponse {
  if (e instanceof Decalage) {
    return NextResponse.json(
      { erreur: e.message, recu: e.recu },
      { status: 409 },
    );
  }
  if (e instanceof VideoRefusee) return refus(e.message, e.statut);
  throw e;
}
