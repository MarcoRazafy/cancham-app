import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { simulateurActif } from "@/lib/vanillapay";

/**
 * Simulateur Vanilla Pay — l'ouverture d'un paiement.
 *
 * Répond l'adresse de la page où « payer » : notre écran de simulation, qui
 * tient lieu de page du prestataire et de téléphone du membre.
 *
 * Tout reste sur l'adresse d'où vient l'appel — le poste local —, même si
 * `APP_URL` désigne la plateforme en ligne : le simulateur ne doit jamais
 * envoyer quelqu'un vers la production.
 */
export async function POST(requete: Request) {
  if (!simulateurActif()) return new Response(null, { status: 404 });
  const jeton = requete.headers.get("authorization") ?? "";
  if (!/^Bearer bac-a-sable-/.test(jeton)) {
    return NextResponse.json({ erreur: "jeton" }, { status: 401 });
  }

  let corps: Record<string, unknown>;
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json({ erreur: "corps" }, { status: 400 });
  }
  const reference = String(corps.reference ?? "");
  const retour = String(corps.redirect_url ?? "");
  const p = await prisma.paiement.findUnique({
    where: { reference },
    select: { id: true },
  });
  if (!p) {
    return NextResponse.json({ erreur: "référence inconnue" }, { status: 404 });
  }
  // La page de retour doit être une page de l'espace membre, ramenée sur
  // l'adresse locale : on ne renvoie nulle part ailleurs.
  const origine = new URL(requete.url).origin;
  let retourLocal: URL;
  try {
    const demande = new URL(retour);
    retourLocal = new URL(`${demande.pathname}${demande.search}`, origine);
  } catch {
    return NextResponse.json({ erreur: "redirect_url" }, { status: 400 });
  }
  if (!retourLocal.pathname.startsWith("/membre/")) {
    return NextResponse.json({ erreur: "redirect_url" }, { status: 400 });
  }

  const url = new URL("/bac-a-sable/paiement", origine);
  url.searchParams.set("ref", reference);
  url.searchParams.set("retour", retourLocal.href);
  return NextResponse.json({ url: url.href });
}
