import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { identifiantsValides, simulateurActif } from "@/lib/vanillapay";

/**
 * Simulateur Vanilla Pay — le jeton d'appel.
 *
 * Joue le prestataire en local, pour parcourir le paiement de bout en bout
 * sans compte marchand : mêmes routes, mêmes en-têtes, même notification
 * signée. Rien ici n'existe en production.
 */
export async function GET(requete: Request) {
  if (!simulateurActif()) return new Response(null, { status: 404 });
  if (
    !identifiantsValides(
      requete.headers.get("keyid"),
      requete.headers.get("keysecret"),
    )
  ) {
    return NextResponse.json({ erreur: "identifiants" }, { status: 401 });
  }
  return NextResponse.json({
    token: `bac-a-sable-${randomBytes(12).toString("hex")}`,
  });
}
