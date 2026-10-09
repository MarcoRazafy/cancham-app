import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/session";
import { EnvoiRefuse, recevoirEnvoi } from "@/lib/televersements";
import { PLAFOND_FICHIER } from "@/lib/plafonds";

export async function POST(requete: Request) {
  const personne = await utilisateurConnecte();
  if (!personne) {
    return NextResponse.json({ erreur: "Connexion requise." }, { status: 401 });
  }

  const annonce = Number(requete.headers.get("content-length") ?? 0);
  if (annonce > PLAFOND_FICHIER) {
    return NextResponse.json(
      { erreur: "Le fichier dépasse le plafond autorisé." },
      { status: 413 },
    );
  }
  if (!requete.body) {
    return NextResponse.json({ erreur: "Fichier vide." }, { status: 400 });
  }

  const nom = decodeURIComponent(
    requete.headers.get("x-nom-fichier") ?? "fichier",
  )
    .replace(/[\\/]/g, "_")
    .slice(0, 120);
  const type = (
    requete.headers.get("content-type") ?? "application/octet-stream"
  )
    .split(";")[0]
    .trim()
    .slice(0, 100);

  try {
    const jeton = await recevoirEnvoi(requete.body, {
      userId: personne.id,
      nom,
      type,
    });
    return NextResponse.json({ jeton });
  } catch (e) {
    if (e instanceof EnvoiRefuse) {
      return NextResponse.json({ erreur: e.message }, { status: 413 });
    }
    throw e;
  }
}
