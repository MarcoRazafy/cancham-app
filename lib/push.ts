import "server-only";

import webpush from "web-push";
import { COURRIEL_EQUIPE } from "@/lib/courriel";
import { prisma } from "@/lib/db";

/**
 * Notifications de l'appareil (Web Push).
 *
 * Ce qu'une personne reçoit sur son téléphone ou son ordinateur, application
 * fermée ou non : un message, une facture, un événement. Chaque navigateur
 * abonné a sa ligne en base (`AbonnementPush`) ; le service worker de
 * l'application (`public/sw.js`) affiche ce qu'on lui envoie et ouvre la
 * bonne page au clic.
 *
 * Les envois se font après la réponse (`after`) : une action n'attend jamais
 * le service de notifications, et ne dépend pas de lui. Sans les clés VAPID
 * (`WEB_PUSH_*`), rien ne part et le bouton « Activer » ne propose rien : la
 * cloche de la plateforme continue seule.
 */

export interface NotificationAppareil {
  titre: string;
  corps: string;
  /**
   * La page à ouvrir au clic, en chemin relatif. Une seule, ou une par
   * espace quand membres et équipe reçoivent la même nouvelle.
   */
  url: string | { membre: string; admin: string };
  /**
   * Regroupe les notifications d'un même sujet : la suivante remplace la
   * précédente au lieu de s'empiler — dix messages d'un fil, une seule
   * notification.
   */
  etiquette?: string;
}

/** Les notifications ne partent qu'avec les deux clés VAPID. */
export function pushActif(): boolean {
  return Boolean(
    process.env.WEB_PUSH_CLE_PUBLIQUE && process.env.WEB_PUSH_CLE_PRIVEE,
  );
}

/** La clé publique : celle que le navigateur reçoit pour s'abonner. */
export function clePushPublique(): string | null {
  return pushActif() ? (process.env.WEB_PUSH_CLE_PUBLIQUE ?? null) : null;
}

let configure = false;
function configurer(): void {
  if (configure) return;
  webpush.setVapidDetails(
    `mailto:${COURRIEL_EQUIPE}`,
    process.env.WEB_PUSH_CLE_PUBLIQUE!,
    process.env.WEB_PUSH_CLE_PRIVEE!,
  );
  configure = true;
}

/** Ce que le navigateur donne à l'abonnement (`PushSubscription.toJSON()`). */
export interface AbonnementRecu {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Une adresse https, pas trop longue, et deux clés en base64url. */
export function abonnementValide(a: unknown): a is AbonnementRecu {
  if (!a || typeof a !== "object") return false;
  const { endpoint, keys } = a as { endpoint?: unknown; keys?: unknown };
  if (typeof endpoint !== "string" || !/^https:\/\/\S{1,1900}$/.test(endpoint))
    return false;
  if (!keys || typeof keys !== "object") return false;
  const { p256dh, auth } = keys as { p256dh?: unknown; auth?: unknown };
  return (
    typeof p256dh === "string" &&
    /^[\w-]{20,200}$/.test(p256dh) &&
    typeof auth === "string" &&
    /^[\w-]{10,60}$/.test(auth)
  );
}

/**
 * Rattache un navigateur à la personne connectée.
 *
 * Un navigateur déjà connu change de personne si quelqu'un d'autre s'y
 * connecte : c'est lui qui reçoit désormais, et l'ancien titulaire ne voit
 * rien passer qui ne le regarde pas.
 */
export async function enregistrerAbonnement(
  userId: string,
  a: AbonnementRecu,
  appareil: string | null,
): Promise<void> {
  await prisma.abonnementPush.upsert({
    where: { endpoint: a.endpoint },
    create: {
      endpoint: a.endpoint,
      p256dh: a.keys.p256dh,
      auth: a.keys.auth,
      appareil,
      userId,
    },
    update: {
      p256dh: a.keys.p256dh,
      auth: a.keys.auth,
      appareil,
      userId,
      vuLe: new Date(),
    },
  });
}

/** Le navigateur ne veut plus rien recevoir. */
export async function retirerAbonnement(
  userId: string,
  endpoint: string,
): Promise<void> {
  await prisma.abonnementPush.deleteMany({ where: { endpoint, userId } });
}

/** La première ligne d'un texte, coupée pour tenir dans une notification. */
export function apercu(texte: string, max = 120): string {
  const ligne = texte.trim().split(/\r?\n/)[0] ?? "";
  return ligne.length > max ? `${ligne.slice(0, max - 1).trimEnd()}…` : ligne;
}

/**
 * Envoie une notification à tous les navigateurs de ces personnes.
 *
 * Ne lève jamais : un envoi qui échoue s'écrit dans les journaux du serveur,
 * et un abonnement que le service déclare disparu (404, 410) s'efface.
 */
export async function notifier(
  userIds: string[],
  n: NotificationAppareil,
): Promise<void> {
  const cibles = [...new Set(userIds)];
  if (!pushActif() || !cibles.length) return;
  configurer();

  const abonnements = await prisma.abonnementPush.findMany({
    where: { userId: { in: cibles } },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
      user: { select: { role: true } },
    },
  });
  if (!abonnements.length) return;

  const perimes: string[] = [];
  await Promise.all(
    abonnements.map(async (a) => {
      const url =
        typeof n.url === "string"
          ? n.url
          : a.user.role === "admin"
            ? n.url.admin
            : n.url.membre;
      const contenu = JSON.stringify({
        titre: n.titre,
        corps: n.corps,
        url,
        etiquette: n.etiquette ?? null,
      });
      try {
        await webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          contenu,
          // Un jour : au-delà, la nouvelle est passée, inutile de réveiller
          // un téléphone rallumé pour un message d'hier.
          { TTL: 24 * 3600, urgency: "normal" },
        );
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) perimes.push(a.id);
        else
          console.error(
            `[push] envoi refusé (${code ?? "réseau"}) :`,
            e instanceof Error ? e.message : e,
          );
      }
    }),
  );
  if (perimes.length) {
    await prisma.abonnementPush.deleteMany({ where: { id: { in: perimes } } });
  }
}

/** Toute l'équipe CanCham. */
export async function notifierEquipe(n: NotificationAppareil): Promise<void> {
  if (!pushActif()) return;
  const equipe = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });
  await notifier(
    equipe.map((u) => u.id),
    n,
  );
}

/** Les comptes d'un membre — ses contacts. */
export async function notifierMembre(
  memberId: string,
  n: NotificationAppareil,
): Promise<void> {
  if (!pushActif()) return;
  const comptes = await prisma.user.findMany({
    where: { memberId, role: "membre" },
    select: { id: true },
  });
  await notifier(
    comptes.map((u) => u.id),
    n,
  );
}

/** Tous les membres de la plateforme : une nouvelle pour tout le monde. */
export async function notifierTousLesMembres(
  n: NotificationAppareil,
): Promise<void> {
  if (!pushActif()) return;
  const comptes = await prisma.user.findMany({
    where: { role: "membre", memberId: { not: null } },
    select: { id: true },
  });
  await notifier(
    comptes.map((u) => u.id),
    n,
  );
}
