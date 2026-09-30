"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signerCorps, simulateurActif } from "@/lib/vanillapay";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/**
 * Simulateur Vanilla Pay — l'issue d'un paiement.
 *
 * Fait ce que ferait le prestataire une fois le débit confirmé ou refusé sur
 * le téléphone : il envoie à notre webhook la notification signée, et
 * renvoie le membre sur la page de retour. C'est bien le webhook qui règle
 * la facture, par la même porte qu'en production.
 *
 * L'adresse est celle de la requête — le poste local —, jamais `APP_URL` :
 * le simulateur ne parle qu'à lui-même.
 */
async function origineLocale(): Promise<string> {
  const h = await headers();
  const hote = h.get("host") ?? "localhost:3000";
  const protocole = /^(localhost|127\.0\.0\.1)(:|$)/.test(hote) ? "http" : "https";
  return `${protocole}://${hote}`;
}
export async function simulerIssue(formData: FormData) {
  if (!simulateurActif()) notFound();

  const origine = await origineLocale();
  const reference = texte(formData, "reference");
  const reussi = texte(formData, "issue") === "reussi";
  const retour = texte(formData, "retour");
  if (!retour.startsWith(`${origine}/membre/`)) notFound();

  const p = await prisma.paiement.findUnique({
    where: { reference },
    select: { montant: true },
  });
  if (!p) notFound();

  const corps = JSON.stringify({
    reference,
    status: reussi ? "success" : "failed",
    montant: p.montant,
    transaction_id: `SIM-${Date.now().toString(36).toUpperCase()}`,
  });
  const signature = signerCorps(corps);
  if (!signature) notFound();

  await fetch(`${origine}/api/paiements/vanillapay`, {
    method: "POST",
    headers: { "content-type": "application/json", "VPI-Signature": signature },
    body: corps,
    cache: "no-store",
  });

  redirect(retour);
}
