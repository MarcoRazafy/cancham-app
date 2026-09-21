import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * Liens à usage unique envoyés par e-mail.
 *
 * Le jeton part dans le lien ; la base n'en garde que l'empreinte SHA-256.
 * Un lien sert une fois, expire (une heure pour une réinitialisation, sept
 * jours pour une invitation), et en demander un nouveau rend l'ancien caduc.
 */

export type UsageJeton = "reinitialisation" | "invitation";

const DUREE: Record<UsageJeton, number> = {
  reinitialisation: 60 * 60 * 1000,
  invitation: 7 * 24 * 60 * 60 * 1000,
};

const empreinte = (brut: string) =>
  createHash("sha256").update(brut).digest("hex");

/** Crée un lien pour ce compte et renvoie le jeton à mettre dans l'adresse. */
export async function creerJeton(
  userId: string,
  usage: UsageJeton,
): Promise<string> {
  await prisma.jetonCompte.deleteMany({
    where: { userId, usage, utiliseLe: null },
  });
  const brut = randomBytes(32).toString("base64url");
  await prisma.jetonCompte.create({
    data: {
      userId,
      usage,
      empreinte: empreinte(brut),
      expire: new Date(Date.now() + DUREE[usage]),
    },
  });
  return brut;
}

/** Le lien, s'il est encore valable : ni utilisé, ni expiré. */
export async function jetonValide(brut: string | undefined) {
  if (!brut || brut.length > 100) return null;
  const jeton = await prisma.jetonCompte.findUnique({
    where: { empreinte: empreinte(brut) },
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          email: true,
          role: true,
          memberId: true,
          member: { select: { nom: true, accueilEnCours: true } },
        },
      },
    },
  });
  if (!jeton || jeton.utiliseLe || jeton.expire < new Date()) return null;
  // Un compte retiré de la plateforme ne se rouvre pas par un vieux lien.
  if (jeton.user.role === "visiteur") return null;
  return jeton;
}
