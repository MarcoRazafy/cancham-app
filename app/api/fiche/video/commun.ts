import { NextResponse } from "next/server";
import { Decalage, VideoRefusee } from "@/lib/videos";

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
