import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { envoyerCourriel, urlPublique } from "@/lib/courriel";
import { prisma } from "@/lib/db";
import { rattacherEquipe } from "@/lib/fil-equipe";
import { courrielReponseVisiteur } from "@/lib/modeles-courriels";

/**
 * Assistance ouverte aux visiteurs de la vitrine, sans compte.
 *
 * Une personne qui découvre la chambre doit pouvoir poser sa question là où
 * elle se trouve, sans adhérer d'abord. Elle laisse son nom, son adresse et
 * son téléphone : sans cela, une réponse n'aurait nulle part où aller, et
 * l'équipe recevrait des messages anonymes auxquels elle ne peut rien.
 *
 * Le fil est celui de la messagerie, comme pour un membre — l'équipe n'a pas
 * deux boîtes à surveiller. Ce qui change : il n'y a pas d'utilisateur
 * derrière, donc pas de session. La clé écrite dans le cookie en tient lieu :
 * elle seule rouvre le fil, sur ce navigateur.
 */

/** Cookie qui porte la clé du fil. Sans lui, la conversation est perdue. */
export const COOKIE_VISITEUR = "cancham_assistance";

/** Trois mois : le temps qu'une question trouve sa réponse, et au-delà. */
const DUREE_COOKIE = 60 * 60 * 24 * 90;

export interface Visiteur {
  nom: string;
  email: string;
  telephone: string;
}

export interface MessageVisiteur {
  id: string;
  de: string;
  /** Réponse de la chambre. Faux : message du visiteur lui-même. */
  equipe: boolean;
  texte: string;
  envoyeLe: string;
  supprime: boolean;
}

export interface FilVisiteur {
  visiteur: Visiteur;
  messages: MessageVisiteur[];
}

/** Ce que la base rend d'un `Json` : on ne le croit qu'après vérification. */
export function visiteurDuFil(json: unknown): Visiteur | null {
  if (!json || typeof json !== "object") return null;
  const v = json as Record<string, unknown>;
  if (typeof v.nom !== "string" || typeof v.email !== "string") return null;
  return {
    nom: v.nom,
    email: v.email,
    telephone: typeof v.telephone === "string" ? v.telephone : "",
  };
}

async function cleCourante(): Promise<string | null> {
  return (await cookies()).get(COOKIE_VISITEUR)?.value ?? null;
}

/** Le fil de ce navigateur, s'il en a un. */
export async function filVisiteur(): Promise<{
  id: string;
  visiteur: Visiteur;
} | null> {
  const cle = await cleCourante();
  if (!cle) return null;
  const fil = await prisma.messageThread.findUnique({
    where: { visiteurCle: cle },
    select: { id: true, visiteur: true },
  });
  const visiteur = fil && visiteurDuFil(fil.visiteur);
  return fil && visiteur ? { id: fil.id, visiteur } : null;
}

/** Nombre de messages relus par la bulle : la fin de la conversation. */
const DERNIERS = 50;

export async function conversationVisiteur(): Promise<FilVisiteur | null> {
  const fil = await filVisiteur();
  if (!fil) return null;

  const lignes = await prisma.message.findMany({
    where: { threadId: fil.id },
    orderBy: { sentAt: "desc" },
    take: DERNIERS,
    select: {
      id: true,
      auteur: true,
      texte: true,
      sentAt: true,
      userId: true,
      supprimeLe: true,
    },
  });

  return {
    visiteur: fil.visiteur,
    messages: lignes.reverse().map((m) => ({
      id: m.id,
      // Le visiteur a la chambre en face de lui, pas la personne de
      // permanence — comme un membre dans son assistance. L'équipe, elle,
      // voit qui a répondu.
      de: m.userId ? "Équipe CanCham" : m.auteur,
      // Dans un fil de visiteur, seule l'équipe a un compte : le message qui
      // porte un utilisateur vient donc de la chambre.
      equipe: m.userId !== null,
      texte: m.supprimeLe ? "" : m.texte,
      envoyeLe: m.sentAt.toISOString(),
      supprime: Boolean(m.supprimeLe),
    })),
  };
}

/**
 * Ouvre le fil d'un visiteur et pose sa clé dans le cookie.
 *
 * Toute l'équipe y est rattachée : la question arrive à la chambre, pas à la
 * personne de permanence.
 */
export async function ouvrirFilVisiteur(v: Visiteur): Promise<string> {
  const cle = randomBytes(24).toString("base64url");
  const equipe = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });
  const fil = await prisma.messageThread.create({
    data: {
      type: "individuel",
      equipe: true,
      nom: v.nom,
      visiteur: { ...v },
      visiteurCle: cle,
      participants: { create: equipe.map((a) => ({ userId: a.id })) },
    },
    select: { id: true },
  });
  // Un compte d'équipe ouvert depuis rejoint le fil.
  await rattacherEquipe(fil.id);

  (await cookies()).set(COOKIE_VISITEUR, cle, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_COOKIE,
  });
  return fil.id;
}

/** Écrit un message du visiteur dans son fil. */
export async function ecrireDuVisiteur(
  threadId: string,
  nom: string,
  texte: string,
): Promise<void> {
  await prisma.message.create({
    data: { threadId, auteur: nom, texte, sentAt: new Date() },
  });
}

/**
 * Prévient le visiteur qu'on lui a répondu.
 *
 * Sans compte, il n'a ni notification ni messagerie où retrouver la réponse :
 * son adresse est tout ce que la chambre a pour le joindre. Sans effet sur un
 * fil de membre, qui, lui, voit la réponse dans la plateforme.
 */
export async function prevenirVisiteur(
  threadId: string,
  reponse: string,
): Promise<void> {
  const fil = await prisma.messageThread.findUnique({
    where: { id: threadId },
    select: { visiteur: true },
  });
  const v = visiteurDuFil(fil?.visiteur);
  if (!v || !reponse.trim()) return;

  await envoyerCourriel(
    courrielReponseVisiteur(v.email, {
      nom: v.nom,
      reponse,
      lien: await urlPublique("/"),
    }),
  );
}
