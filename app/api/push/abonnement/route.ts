import { NextResponse } from "next/server";
import {
  abonnementValide,
  clePushPublique,
  enregistrerAbonnement,
  retirerAbonnement,
} from "@/lib/push";
import { utilisateurConnecte } from "@/lib/session";

/**
 * L'abonnement d'un navigateur aux notifications de l'appareil.
 *
 * GET donne la clé publique avec laquelle s'abonner ; POST rattache
 * l'abonnement à la personne connectée ; DELETE le retire. Le service worker
 * appelle aussi POST de lui-même quand le navigateur change l'adresse de
 * l'abonnement — il n'a pas d'action serveur sous la main, d'où cette
 * route. Réservé aux personnes connectées.
 */

const connexionRequise = () =>
  NextResponse.json({ erreur: "Connexion requise." }, { status: 401 });

async function corps(requete: Request): Promise<Record<string, unknown>> {
  try {
    const lu = await requete.json();
    return lu && typeof lu === "object" ? lu : {};
  } catch {
    return {};
  }
}

export async function GET() {
  const personne = await utilisateurConnecte();
  if (!personne) return connexionRequise();
  return NextResponse.json({ cle: clePushPublique() });
}

export async function POST(requete: Request) {
  const personne = await utilisateurConnecte();
  if (!personne) return connexionRequise();

  const { abonnement, appareil } = await corps(requete);
  if (!abonnementValide(abonnement)) {
    return NextResponse.json(
      { erreur: "Abonnement illisible." },
      { status: 400 },
    );
  }
  await enregistrerAbonnement(
    personne.id,
    abonnement,
    typeof appareil === "string" ? appareil.slice(0, 80) : null,
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(requete: Request) {
  const personne = await utilisateurConnecte();
  if (!personne) return connexionRequise();

  const { endpoint } = await corps(requete);
  if (typeof endpoint !== "string") {
    return NextResponse.json({ erreur: "Adresse manquante." }, { status: 400 });
  }
  await retirerAbonnement(personne.id, endpoint);
  return NextResponse.json({ ok: true });
}
