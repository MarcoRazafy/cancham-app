import { NextResponse } from "next/server";
import { RELAIS_RETOUR } from "@/lib/retour-paiement";
import { prisma } from "@/lib/db";
import { simulateurActif } from "@/lib/vanillapay";

const refus = (statut: number, motif: string) =>
  NextResponse.json(
    { CodeRetour: statut, DescRetour: motif, DetailRetour: "", Data: null },
    { status: statut },
  );

export async function POST(requete: Request) {
  if (!simulateurActif()) return new Response(null, { status: 404 });
  if (
    !/^Bearer bac-a-sable-/.test(requete.headers.get("authorization") ?? "")
  ) {
    return refus(401, "Jeton refusé");
  }

  let corps: Record<string, unknown>;
  try {
    corps = await requete.json();
  } catch {
    return refus(400, "Corps illisible");
  }
  const reference = String(corps.reference ?? "");
  const retour = String(corps.redirect_url ?? "");
  const mode = String(corps.mode_paiement ?? "");
  if (mode !== "international" && mode !== "mobile_money") {
    return refus(400, "mode_paiement attendu : international ou mobile_money");
  }
  const p = await prisma.paiement.findUnique({
    where: { reference },
    select: { id: true },
  });
  if (!p) return refus(404, "Référence inconnue");

  const origine = new URL(requete.url).origin;
  let retourLocal: URL;
  try {
    const demande = new URL(retour);
    retourLocal = new URL(`${demande.pathname}${demande.search}`, origine);
  } catch {
    return refus(400, "redirect_url illisible");
  }
  if (
    retourLocal.pathname !== RELAIS_RETOUR &&
    !/^\/(membre|evenements)\//.test(retourLocal.pathname)
  ) {
    return refus(400, "redirect_url refusée");
  }

  const url = new URL("/bac-a-sable/paiement", origine);
  url.searchParams.set("id", reference);
  url.searchParams.set("retour", retourLocal.href);
  return NextResponse.json({
    CodeRetour: 200,
    DescRetour: "Génération de lien de paiement",
    DetailRetour: "",
    Data: { url: url.href },
  });
}
