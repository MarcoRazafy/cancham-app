import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { simulateurActif } from "@/lib/vanillapay";

/** Simulateur Vanilla Pay — l'état d'un paiement, tel que nous le connaissons. */
export async function GET(
  requete: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  if (!simulateurActif()) return new Response(null, { status: 404 });
  if (!/^Bearer bac-a-sable-/.test(requete.headers.get("authorization") ?? "")) {
    return NextResponse.json({ erreur: "jeton" }, { status: 401 });
  }
  const { ref } = await params;
  const p = await prisma.paiement.findFirst({
    where: { OR: [{ reference: ref }, { transaction: ref }] },
    select: { reference: true, statut: true, montant: true, transaction: true },
  });
  if (!p) return NextResponse.json({ erreur: "inconnu" }, { status: 404 });
  return NextResponse.json({
    reference: p.reference,
    status:
      p.statut === "reussie"
        ? "success"
        : p.statut === "echouee"
          ? "failed"
          : "pending",
    montant: p.montant,
    transaction_id: p.transaction,
  });
}
