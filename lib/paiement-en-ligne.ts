import "server-only";

import { headers } from "next/headers";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { referenceReglement } from "@/lib/reglements";
import { versRelais } from "@/lib/retour-paiement";
import { baseSite } from "@/lib/site";
import { ouvrirPaiement, type ModePaiement } from "@/lib/vanillapay";

function basePrestataire(): string {
  const domaine = process.env.DOMAINE_PRINCIPAL?.trim().toLowerCase();
  return domaine ? `https://${domaine}` : baseSite();
}

async function baseRetour(): Promise<string> {
  if (process.env.NODE_ENV === "production") return basePrestataire();
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host");
  if (!hote) return basePrestataire();
  const protocole =
    h.get("x-forwarded-proto") ??
    (/^(localhost|127\.0\.0\.1)(:|$)/.test(hote) ? "http" : "https");
  return `${protocole}://${hote}`;
}

export async function ouvrirChezLePrestataire(
  p: { id: string; montant: number; numeroFacture: string | null },
  mode: ModePaiement,
  detail?: Prisma.InputJsonValue,
  cheminRetour: (reference: string) => string = (reference) =>
    `/membre/cotisations/retour?ref=${encodeURIComponent(reference)}`,
): Promise<{ url: string } | { raison: string }> {
  const reference = referenceReglement();
  await prisma.paiement.update({
    where: { id: p.id },
    data: {
      reference,
      statut: "en_cours",
      ...(detail === undefined ? {} : { detail }),
    },
  });

  const ouverture = await ouvrirPaiement({
    montant: p.montant,
    reference,
    panier: p.numeroFacture ?? reference,
    mode,
    notifUrl: `${basePrestataire()}/api/paiements/vanillapay`,
    redirectUrl: `${await baseRetour()}${versRelais(cheminRetour(reference))}`,
  });
  if ("raison" in ouverture) return ouverture;

  if (ouverture.id) {
    await prisma.paiement.update({
      where: { id: p.id },
      data: { transaction: ouverture.id },
    });
  }
  return { url: ouverture.url };
}
