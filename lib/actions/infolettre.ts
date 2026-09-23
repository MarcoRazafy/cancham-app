"use server";

import { after } from "next/server";
import { prisma } from "@/lib/db";
import { minutes, origineAppelante, tentative } from "@/lib/limite";
import { inscrireContact } from "@/lib/systeme-io";

/**
 * Inscription à la lettre d'information, depuis la page publique.
 *
 * Deux champs, comme sur la page d'inscription de la chambre : le prénom et
 * l'adresse. C'est un point d'entrée ouvert à tous, donc tout y est vérifié
 * et compté.
 *
 * Une adresse déjà inscrite reçoit la même réponse qu'une nouvelle : dire
 * « vous êtes déjà dans la liste » révélerait à un inconnu qui s'y trouve.
 */

/** Inscriptions qu'une même origine peut tenter en une heure. */
const PAR_HEURE = 10;

const ADRESSE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ReponseInfolettre =
  | { ok: true; message: string }
  | { ok: false; erreur: string; champ?: "prenom" | "email" };

const propre = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export async function inscrireInfolettre(saisie: {
  prenom?: string;
  email?: string;
}): Promise<ReponseInfolettre> {
  const attente = tentative(
    `infolettre:${await origineAppelante()}`,
    PAR_HEURE,
    60 * 60 * 1000,
  );
  if (attente) {
    const m = minutes(attente);
    return {
      ok: false,
      erreur: `Trop d’essais depuis cet appareil. Réessayez dans ${m} minute${m > 1 ? "s" : ""}.`,
    };
  }

  const prenom = propre(saisie.prenom, 80);
  const email = propre(saisie.email, 120).toLowerCase();
  if (prenom.length < 2) {
    return { ok: false, erreur: "Indiquez votre prénom.", champ: "prenom" };
  }
  if (!ADRESSE.test(email)) {
    return {
      ok: false,
      erreur: "Indiquez une adresse e-mail valide.",
      champ: "email",
    };
  }

  // Une réinscription remet la personne dans la liste plutôt que d'échouer
  // sur l'unicité de l'adresse.
  const abonne = await prisma.abonne.upsert({
    where: { email },
    update: { prenom, desabonneLe: null },
    create: { prenom, email, source: "vitrine" },
  });

  // La liste qui sert aux envois est celle de la chambre, chez systeme.io :
  // le contact l'y rejoint après la réponse, pour ne pas faire attendre
  // devant un formulaire. L'inscription est déjà enregistrée ici.
  after(async () => {
    if (await inscrireContact({ prenom, email })) {
      await prisma.abonne.update({
        where: { id: abonne.id },
        data: { synchroniseLe: new Date() },
      });
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "abonne_infolettre",
      entite: "Abonne",
      entiteId: abonne.id,
      acteur: prenom,
      detail: `Inscription à la lettre d’information depuis la page publique · ${email}.`,
    },
  });

  return {
    ok: true,
    message: "Merci, votre inscription a bien été prise en compte !",
  };
}
