"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { telephoneValide } from "@/lib/accueil";
import { COURRIEL_EQUIPE, envoyerCourriel, urlPublique } from "@/lib/courriel";
import { minutes, origineAppelante, tentative } from "@/lib/limite";
import { courrielQuestionVisiteur } from "@/lib/modeles-courriels";
import {
  conversationVisiteur,
  ecrireDuVisiteur,
  filVisiteur,
  ouvrirFilVisiteur,
  type FilVisiteur,
} from "@/lib/support-visiteur";

/**
 * L'assistance depuis la vitrine, pour qui n'a pas de compte.
 *
 * Tout passe par ici : c'est un point d'entrée public, donc tout y est
 * vérifié et compté. Le premier message demande de quoi répondre — nom,
 * adresse, téléphone ; les suivants reprennent le fil du navigateur.
 */

/** Messages qu'une même origine peut envoyer en une heure. */
const MESSAGES_PAR_HEURE = 20;

const ADRESSE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEXTE_MAX = 2000;

type Reponse =
  | { ok: true; fil: FilVisiteur }
  | { ok: false; erreur: string; champ?: "nom" | "email" | "telephone" };

const propre = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export async function envoyerAuSupportPublic(saisie: {
  nom?: string;
  email?: string;
  telephone?: string;
  texte: string;
}): Promise<Reponse> {
  const attente = tentative(
    `support-public:${await origineAppelante()}`,
    MESSAGES_PAR_HEURE,
    60 * 60 * 1000,
  );
  if (attente) {
    const m = minutes(attente);
    return {
      ok: false,
      erreur: `Trop de messages envoyés depuis cet appareil. Réessayez dans ${m} minute${m > 1 ? "s" : ""}.`,
    };
  }

  const texte = String(saisie.texte ?? "")
    .trim()
    .slice(0, TEXTE_MAX);
  if (!texte) return { ok: false, erreur: "Écrivez votre question." };

  const existant = await filVisiteur();

  // Fil déjà ouvert : l'identité est celle qu'il porte, on ne la redemande pas.
  if (existant) {
    await ecrireDuVisiteur(existant.id, existant.visiteur.nom, texte);
    revalidatePath("/", "layout");
    return { ok: true, fil: (await conversationVisiteur())! };
  }

  const nom = propre(saisie.nom, 80);
  const email = propre(saisie.email, 120).toLowerCase();
  const telephone = propre(saisie.telephone, 30);
  if (nom.length < 2) {
    return { ok: false, erreur: "Indiquez votre nom.", champ: "nom" };
  }
  if (!ADRESSE.test(email)) {
    return {
      ok: false,
      erreur: "Indiquez une adresse e-mail valide.",
      champ: "email",
    };
  }
  if (!telephoneValide(telephone)) {
    return {
      ok: false,
      erreur: "Indiquez un numéro de téléphone.",
      champ: "telephone",
    };
  }

  const visiteur = { nom, email, telephone };
  const threadId = await ouvrirFilVisiteur(visiteur);
  await ecrireDuVisiteur(threadId, nom, texte);

  await prisma.auditLog.create({
    data: {
      action: "question_visiteur",
      entite: "MessageThread",
      entiteId: threadId,
      acteur: nom,
      detail: `Question posée depuis le site public · ${email} · ${telephone}.`,
    },
  });

  // L'équipe n'est pas forcément devant le back-office : on la prévient.
  const lien = await urlPublique(`/admin/messagerie?t=${threadId}`);
  after(() =>
    envoyerCourriel(
      courrielQuestionVisiteur(COURRIEL_EQUIPE, {
        ...visiteur,
        question: texte,
        lien,
      }),
    ),
  );

  revalidatePath("/", "layout");
  return { ok: true, fil: (await conversationVisiteur())! };
}
