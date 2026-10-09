import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { identifiantsValides, simulateurActif } from "@/lib/vanillapay";

export async function GET(requete: Request) {
  if (!simulateurActif()) return new Response(null, { status: 404 });
  if (
    !identifiantsValides(
      requete.headers.get("client-id"),
      requete.headers.get("client-secret"),
    )
  ) {
    return NextResponse.json(
      {
        CodeRetour: 401,
        DescRetour: "Identifiants refusés",
        DetailRetour: "",
        Data: null,
      },
      { status: 401 },
    );
  }
  return NextResponse.json({
    CodeRetour: 200,
    DescRetour: "Génération TOKEN",
    DetailRetour: "",
    Data: { Token: `Bearer bac-a-sable-${randomBytes(12).toString("hex")}` },
  });
}
