import { NextResponse } from "next/server";
import { ficheParApi } from "@/lib/autorisations";
import { minutes, tentative } from "@/lib/limite";
import { MORCEAU_VIDEO } from "@/lib/video-presentation";
import { ouvrirEnvoi } from "@/lib/videos";
import { dIci, refus, reponseDErreur } from "./commun";

/** Envois de vidéo ouverts par une même personne, en une heure. */
const ENVOIS_PAR_HEURE = 12;

/**
 * Ouvre l'envoi d'une vidéo de présentation.
 *
 * Le navigateur annonce le nom et le poids du fichier ; s'ils conviennent, il
 * reçoit l'identifiant sous lequel envoyer la vidéo, morceau par morceau
 * (`/api/fiche/video/[id]`). Un membre n'ouvre un envoi que pour sa propre
 * fiche ; l'équipe, pour celle qu'elle désigne.
 */
export async function POST(requete: Request) {
  if (!dIci(requete)) return refus("Requête refusée.", 403);

  let demande: { memberId?: unknown; nom?: unknown; taille?: unknown };
  try {
    demande = await requete.json();
  } catch {
    return refus("Demande illisible.", 400);
  }

  const acces = await ficheParApi(
    typeof demande?.memberId === "string" ? demande.memberId : "",
  );
  if (!acces.ok) return refus(acces.erreur, acces.statut);

  const attente = tentative(
    `video:${acces.userId}`,
    ENVOIS_PAR_HEURE,
    60 * 60 * 1000,
  );
  if (attente) {
    return refus(
      `Trop d’envois à la suite. Réessayez dans ${minutes(attente)} minute${minutes(attente) > 1 ? "s" : ""}.`,
      429,
    );
  }

  try {
    const id = await ouvrirEnvoi({
      userId: acces.userId,
      memberId: acces.memberId,
      nom: typeof demande.nom === "string" ? demande.nom.slice(0, 200) : "",
      taille: typeof demande.taille === "number" ? demande.taille : NaN,
    });
    return NextResponse.json({ id, morceau: MORCEAU_VIDEO });
  } catch (e) {
    return reponseDErreur(e);
  }
}
