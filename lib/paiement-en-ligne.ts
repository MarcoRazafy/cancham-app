import "server-only";

import { headers } from "next/headers";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { referenceReglement } from "@/lib/reglements";
import { baseSite } from "@/lib/site";
import { ouvrirPaiement, type ModePaiement } from "@/lib/vanillapay";

/**
 * L'ouverture d'un paiement chez le prestataire, pour un règlement donné.
 *
 * Partagée par tout ce qui envoie un membre payer en ligne : la tuile
 * « Carte bancaire », qui y mène directement, l'écran de la carte, et le
 * paiement direct des portefeuilles. Qui appelle a déjà vérifié à qui est
 * le règlement, et qu'il peut se payer ainsi.
 */

/**
 * Où ramener le membre après le paiement.
 *
 * En production, l'adresse publique de la plateforme. En développement,
 * celle d'où il vient : `APP_URL` peut y désigner la plateforme en ligne, et
 * l'y ramener le sortirait de sa base locale. La notification, elle, vise
 * toujours l'adresse publique — le prestataire ne peut joindre que
 * celle-là ; sur un poste de développement, c'est donc la page de retour
 * qui demande l'état du paiement.
 */
async function baseRetour(): Promise<string> {
  if (process.env.NODE_ENV === "production") return baseSite();
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host");
  if (!hote) return baseSite();
  const protocole =
    h.get("x-forwarded-proto") ??
    (/^(localhost|127\.0\.0\.1)(:|$)/.test(hote) ? "http" : "https");
  return `${protocole}://${hote}`;
}

/**
 * Ouvre le paiement et rend l'adresse où envoyer le membre, ou la raison du
 * refus — dans ce cas le règlement reste ouvert, et il peut réessayer.
 *
 * Chaque tentative prend une référence neuve : le prestataire refuse de
 * rouvrir une référence déjà envoyée, et c'est elle, et elle seule, qui
 * relie sa notification au bon règlement. On garde aussi la référence de la
 * transaction chez lui, lue sur le lien : c'est elle qu'on lui présente pour
 * demander où en est le paiement, si sa notification ne nous parvient pas.
 */
export async function ouvrirChezLePrestataire(
  p: { id: string; montant: number; numeroFacture: string | null },
  mode: ModePaiement,
  detail?: Prisma.InputJsonValue,
  /**
   * Où ramener le payeur, en chemin relatif, une fois la référence connue.
   * À défaut, la page de retour de l'espace membre.
   */
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
    notifUrl: `${baseSite()}/api/paiements/vanillapay`,
    redirectUrl: `${await baseRetour()}${cheminRetour(reference)}`,
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
