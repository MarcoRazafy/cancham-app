import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { simulateurActif } from "@/lib/vanillapay";

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!simulateurActif()) return new Response(null, { status: 404 });
  if (
    !/^Bearer bac-a-sable-/.test(requete.headers.get("authorization") ?? "")
  ) {
    return NextResponse.json(
      {
        CodeRetour: 401,
        DescRetour: "Jeton refusé",
        DetailRetour: "",
        Data: null,
      },
      { status: 401 },
    );
  }
  const { id } = await params;
  const p = await prisma.paiement.findFirst({
    where: { OR: [{ reference: id }, { transaction: id }] },
    select: {
      reference: true,
      statut: true,
      montant: true,
      mode: true,
      transaction: true,
      invoice: { select: { numero: true } },
    },
  });
  if (!p) {
    return NextResponse.json(
      {
        CodeRetour: 404,
        DescRetour: "Paiement inconnu",
        DetailRetour: "",
        Data: null,
      },
      { status: 404 },
    );
  }
  return NextResponse.json({
    CodeRetour: 200,
    DescRetour: "Statut de la transaction",
    DetailRetour: "",
    Data: {
      reference_VPI: p.statut === "reussie" ? p.transaction : null,
      panier: p.invoice?.numero ?? p.reference,
      reference: p.reference,
      remarque: "Simulation",
      etat:
        p.statut === "reussie"
          ? "SUCCESS"
          : p.statut === "echouee"
            ? "FAILED"
            : "INITIATED",
      ...(p.mode === "carte"
        ? {
            montant: Math.round((p.montant / 4950) * 100) / 100,
            montant_mga: p.montant,
          }
        : { montant: p.montant }),
    },
  });
}
