import { NextResponse } from "next/server";
import {
  abonnementValide,
  clePushPublique,
  enregistrerAbonnement,
  retirerAbonnement,
} from "@/lib/push";
import { utilisateurConnecte } from "@/lib/session";

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
