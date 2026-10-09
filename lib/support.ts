import "server-only";

import { prisma } from "@/lib/db";
import { initialesDe, LOGO_EQUIPE } from "@/lib/avatars";
import { visiteurDuFil } from "@/lib/support-visiteur";
import type { PieceJointe } from "@/lib/types";

export interface MessageSupport {
  id: string;
  de: string;
  moi: boolean;
  equipe: boolean;
  texte: string;
  envoyeLe: string;
  supprime: boolean;
  pieces: PieceJointe[];
}

export interface ConversationSupport {
  id: string;
  nom: string;
  sousTitre: string;
  avatar: string | null;
  init: string;
  membreId: string | null;
  nonLus: number;
  messages: MessageSupport[];
}

export interface ResumeSupport {
  id: string;
  nom: string;
  sousTitre: string;
  avatar: string | null;
  init: string;
  nonLus: number;
  apercu: string;
  le: string;
}

const PERSONNE = {
  id: true,
  nom: true,
  photo: true,
  role: true,
  member: { select: { id: true, nom: true } },
} as const;

const DERNIERS = 60;

async function nonLusParFil(userId: string): Promise<Map<string, number>> {
  const lignes = await prisma.$queryRaw<{ fil: string; n: number }[]>`
    SELECT m."threadId" AS fil, count(*)::int AS n
    FROM messages m
    JOIN participants_fils p
      ON p."threadId" = m."threadId" AND p."userId" = ${userId}
    JOIN message_threads t ON t.id = m."threadId" AND t.equipe
    WHERE m."supprimeLe" IS NULL
      AND m."userId" IS DISTINCT FROM ${userId}
      AND (p."luLe" IS NULL OR m."sentAt" > p."luLe")
    GROUP BY m."threadId"`;
  return new Map(lignes.map((l) => [l.fil, l.n]));
}

async function messagesDe(
  threadId: string,
  userId: string,
): Promise<MessageSupport[]> {
  const lignes = await prisma.message.findMany({
    where: { threadId },
    orderBy: { sentAt: "desc" },
    take: DERNIERS,
    include: { piecesJointes: { orderBy: { createdAt: "asc" } } },
  });
  const auteurs = [...new Set(lignes.map((m) => m.userId).filter(Boolean))];
  const admins = new Set(
    (
      await prisma.user.findMany({
        where: { id: { in: auteurs as string[] }, role: "admin" },
        select: { id: true },
      })
    ).map((u) => u.id),
  );

  return lignes.reverse().map((m) => ({
    id: m.id,
    de: m.auteur,
    moi: m.userId === userId,
    equipe: m.userId !== userId && admins.has(m.userId ?? ""),
    texte: m.supprimeLe ? "" : m.texte,
    envoyeLe: m.sentAt.toISOString(),
    supprime: Boolean(m.supprimeLe),
    pieces: m.supprimeLe
      ? []
      : m.piecesJointes.map((p) => ({
          id: p.id,
          nom: p.nom,
          type: p.type,
          taille: p.taille,
        })),
  }));
}

export async function supportMembre(userId: string): Promise<{
  conversation: ConversationSupport | null;
  nonLus: number;
}> {
  const fil = await prisma.messageThread.findFirst({
    where: { equipe: true, participants: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    select: { id: true, nom: true },
  });
  if (!fil) return { conversation: null, nonLus: 0 };

  const [compte, messages] = await Promise.all([
    nonLusParFil(userId),
    messagesDe(fil.id, userId),
  ]);
  const nonLus = compte.get(fil.id) ?? 0;
  const nom = fil.nom ?? "Équipe CanCham";
  return {
    conversation: {
      id: fil.id,
      nom,
      sousTitre: "Support membres",
      avatar: LOGO_EQUIPE,
      init: initialesDe(nom),
      membreId: null,
      nonLus,
      messages,
    },
    nonLus,
  };
}

interface Participant {
  user: {
    id: string;
    nom: string;
    photo: string | null;
    role: string;
    member: { id: string; nom: string } | null;
  };
}

function membreDuFil(participants: Participant[]) {
  return (
    participants.find((p) => p.user.role !== "admin")?.user ??
    participants[0]?.user ??
    null
  );
}

export async function supportEquipe(userId: string): Promise<{
  fils: ResumeSupport[];
  nonLus: number;
}> {
  const [lignes, compte] = await Promise.all([
    prisma.messageThread.findMany({
      where: { equipe: true, participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: PERSONNE } } },
        messages: { orderBy: { sentAt: "desc" }, take: 1 },
      },
    }),
    nonLusParFil(userId),
  ]);

  const fils = lignes
    .map((t): ResumeSupport => {
      const visiteur = visiteurDuFil(t.visiteur);
      const membre = membreDuFil(t.participants);
      const dernier = t.messages[0];
      const nom = visiteur?.nom ?? membre?.nom ?? "Conversation";
      let apercu = "Nouvelle conversation";
      if (dernier) {
        const corps = dernier.supprimeLe
          ? "Message supprimé"
          : dernier.texte || "📎 Pièce jointe";
        apercu =
          dernier.userId === userId
            ? `Vous : ${corps}`
            : dernier.userId === null || dernier.userId === membre?.id
              ? corps
              : `${dernier.auteur.split(" ")[0]} : ${corps}`;
      }
      return {
        id: t.id,
        nom,
        sousTitre: visiteur
          ? ["Visiteur du site", visiteur.email, visiteur.telephone]
              .filter(Boolean)
              .join(" · ")
          : (membre?.member?.nom ?? ""),
        avatar: visiteur ? null : (membre?.photo ?? null),
        init: initialesDe(nom),
        nonLus: compte.get(t.id) ?? 0,
        apercu,
        le: (dernier?.sentAt ?? t.createdAt).toISOString(),
      };
    })
    .sort((a, b) => b.le.localeCompare(a.le));

  return {
    fils,
    nonLus: fils.reduce((n, f) => n + f.nonLus, 0),
  };
}

export async function conversationEquipe(
  threadId: string,
  userId: string,
): Promise<ConversationSupport | null> {
  const t = await prisma.messageThread.findFirst({
    where: {
      id: threadId,
      equipe: true,
      participants: { some: { userId } },
    },
    include: { participants: { include: { user: { select: PERSONNE } } } },
  });
  if (!t) return null;

  const visiteur = visiteurDuFil(t.visiteur);
  const membre = membreDuFil(t.participants);
  const [compte, messages] = await Promise.all([
    nonLusParFil(userId),
    messagesDe(t.id, userId),
  ]);
  const nom = visiteur?.nom ?? membre?.nom ?? "Conversation";
  return {
    id: t.id,
    nom,
    sousTitre: visiteur
      ? ["Visiteur du site", visiteur.email, visiteur.telephone]
          .filter(Boolean)
          .join(" · ")
      : (membre?.member?.nom ?? ""),
    avatar: visiteur ? null : (membre?.photo ?? null),
    init: initialesDe(nom),
    membreId: membre?.member?.id ?? null,
    nonLus: compte.get(t.id) ?? 0,
    messages,
  };
}

export interface MessageRecu {
  id: string;
  threadId: string;
  auteur: string;
  entreprise: string;
  avatar: string | null;
  init: string;
  texte: string;
  pieces: number;
  le: string;
  nonLu: boolean;
}

export async function derniersMessagesMembres(
  userId: string,
  limite = 6,
): Promise<MessageRecu[]> {
  const equipe = (
    await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    })
  ).map((u) => u.id);

  const lignes = await prisma.message.findMany({
    where: {
      supprimeLe: null,
      thread: { equipe: true, participants: { some: { userId } } },
      OR: [{ userId: null }, { userId: { notIn: equipe } }],
    },
    orderBy: { sentAt: "desc" },
    take: limite,
    include: { _count: { select: { piecesJointes: true } } },
  });

  const [auteurs, lectures] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: { in: lignes.map((m) => m.userId).filter((id) => id !== null) },
      },
      select: PERSONNE,
    }),
    prisma.participantFil.findMany({
      where: { userId, threadId: { in: lignes.map((m) => m.threadId) } },
      select: { threadId: true, luLe: true },
    }),
  ]);

  return lignes.map((m) => {
    const u = auteurs.find((a) => a.id === m.userId);
    const lu = lectures.find((l) => l.threadId === m.threadId)?.luLe;
    const nom = u?.nom ?? m.auteur;
    return {
      id: m.id,
      threadId: m.threadId,
      auteur: nom,
      entreprise: u?.member?.nom ?? "",
      avatar: u?.photo ?? null,
      init: initialesDe(nom),
      texte: m.texte,
      pieces: m._count.piecesJointes,
      le: m.sentAt.toISOString(),
      nonLu: !lu || m.sentAt > lu,
    };
  });
}
