"use server";

import { headers } from "next/headers";
import { destinationDuRetour, RELAIS_RETOUR } from "@/lib/retour-paiement";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signerCorps, simulateurActif } from "@/lib/vanillapay";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

async function origineLocale(): Promise<string> {
  const h = await headers();
  const hote = h.get("host") ?? "localhost:3000";
  const protocole = /^(localhost|127\.0\.0\.1)(:|$)/.test(hote)
    ? "http"
    : "https";
  return `${protocole}://${hote}`;
}
export async function simulerIssue(formData: FormData) {
  if (!simulateurActif()) notFound();

  const origine = await origineLocale();
  const reference = texte(formData, "reference");
  const reussi = texte(formData, "issue") === "reussi";
  const retour = texte(formData, "retour");
  if (
    !retour.startsWith(`${origine}${RELAIS_RETOUR}?`) &&
    !retour.startsWith(`${origine}/membre/`) &&
    !retour.startsWith(`${origine}/evenements/`)
  ) {
    notFound();
  }

  const p = await prisma.paiement.findUnique({
    where: { reference },
    select: {
      montant: true,
      mode: true,
      detail: true,
      invoice: { select: { numero: true } },
    },
  });
  if (!p) notFound();

  const horodatage = Date.now().toString().slice(-12);
  const commun = {
    reference,
    panier: p.invoice?.numero ?? reference,
    etat: reussi ? "SUCCESS" : "FAILED",
  };
  const detail = (
    p.detail && typeof p.detail === "object" && !Array.isArray(p.detail)
      ? p.detail
      : {}
  ) as Record<string, unknown>;
  const corps = JSON.stringify(
    p.mode === "carte"
      ? {
          reference_VPI: `VPI${horodatage}`,
          ...commun,
          montant: Math.round((p.montant / 4950) * 100) / 100,
          montant_mga: p.montant,
        }
      : {
          reference_VPI: `MM${horodatage}`,
          ...commun,
          montant: p.montant,
          initiateur:
            typeof detail.telephone === "string" ? detail.telephone : "",
          referenceMM: horodatage.slice(-7),
        },
  );
  const signature = signerCorps(corps);
  if (!signature) notFound();

  await fetch(`${origine}/api/paiements/vanillapay`, {
    method: "POST",
    headers: { "content-type": "application/json", "VPI-Signature": signature },
    body: corps,
    cache: "no-store",
  });

  const url = new URL(retour);
  redirect(
    url.pathname === RELAIS_RETOUR
      ? destinationDuRetour(url.searchParams.get("vers"))
      : retour,
  );
}
