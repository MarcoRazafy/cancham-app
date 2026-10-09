import "server-only";

import webpush from "web-push";
import { COURRIEL_EQUIPE } from "@/lib/courriel";
import { prisma } from "@/lib/db";

export interface NotificationAppareil {
  titre: string;
  corps: string;
  url: string | { membre: string; admin: string };
  etiquette?: string;
}

export function pushActif(): boolean {
  return Boolean(
    process.env.WEB_PUSH_CLE_PUBLIQUE && process.env.WEB_PUSH_CLE_PRIVEE,
  );
}

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

export interface AbonnementRecu {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

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

export async function retirerAbonnement(
  userId: string,
  endpoint: string,
): Promise<void> {
  await prisma.abonnementPush.deleteMany({ where: { endpoint, userId } });
}

export function apercu(texte: string, max = 120): string {
  const ligne = texte.trim().split(/\r?\n/)[0] ?? "";
  return ligne.length > max ? `${ligne.slice(0, max - 1).trimEnd()}…` : ligne;
}

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
