"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MOTIFS_CONTACT } from "@/lib/coordonnees";
import { prisma } from "@/lib/db";
import { ecrireAEquipe } from "@/lib/fil-equipe";
import { redirectWithFlash } from "@/lib/flash";
import { fmtMoney } from "@/lib/format";
import {
  LONGUEUR_NOM_GROUPE,
  MAX_CIBLES_TRANSFERT,
  MAX_PARTICIPANTS_GROUPE,
  critereJoignable,
} from "@/lib/messagerie";
import { getCurrentUser } from "@/lib/session";
import {
  PIECES_PAR_MESSAGE,
  PieceRefusee,
  copierPiece,
  effacerPiece,
  recevoirPiece,
} from "@/lib/stockage-messagerie";
import { ImageRefusee, enregistrerImage } from "@/lib/uploads";
import type { Space } from "@/lib/types";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** La messagerie n'existe que dans ces deux espaces. */
const espace = (fd: FormData): "membre" | "admin" =>
  texte(fd, "space") === "admin" ? "admin" : "membre";

const lienFil = (space: Space, threadId: string) =>
  `/${space}/messagerie?t=${threadId}`;

/** Un fil n'est lisible, et on ne peut y écrire, qu'en y participant. */
async function participe(threadId: string, userId: string) {
  const p = await prisma.participantFil.findUnique({
    where: { threadId_userId: { threadId, userId } },
    select: { userId: true },
  });
  return Boolean(p);
}

/**
 * Le fil individuel entre deux personnes : celui qui existe, sinon un nouveau.
 *
 * Sans cette recherche préalable, chaque clic sur « Envoyer un message » ou
 * chaque transfert ouvrirait un fil de plus avec le même interlocuteur, chacun
 * avec un bout de l'historique.
 */
async function filIndividuel(moi: string, autre: string): Promise<string> {
  const existant = await prisma.messageThread.findFirst({
    where: {
      type: "individuel",
      equipe: false,
      AND: [
        { participants: { some: { userId: moi } } },
        { participants: { some: { userId: autre } } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (existant) return existant.id;

  const fil = await prisma.messageThread.create({
    data: {
      type: "individuel",
      participants: {
        create: [{ userId: moi, luLe: new Date() }, { userId: autre }],
      },
    },
    select: { id: true },
  });
  return fil.id;
}

/**
 * Envoi d'un message dans un fil : du texte, des pièces jointes, ou les deux.
 *
 * Les pièces sont toutes contrôlées avant d'écrire quoi que ce soit : un
 * fichier refusé dans un lot ne doit pas laisser un message à moitié envoyé.
 */
export async function sendMessage(formData: FormData) {
  const threadId = texte(formData, "threadId");
  const space = espace(formData);
  const contenu = texte(formData, "texte");
  const retour = lienFil(space, threadId);

  const user = await getCurrentUser(space);
  if (!(await participe(threadId, user.id))) {
    redirectWithFlash(
      `/${space}/messagerie`,
      "Vous ne participez pas à cette conversation.",
    );
  }

  const fichiers = formData
    .getAll("pieces")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!contenu && fichiers.length === 0) {
    redirectWithFlash(retour, "Le message est vide.");
  }
  if (fichiers.length > PIECES_PAR_MESSAGE) {
    redirectWithFlash(
      retour,
      `${PIECES_PAR_MESSAGE} pièces jointes au plus par message.`,
    );
  }

  const pieces = [];
  try {
    for (const f of fichiers) {
      const recue = await recevoirPiece(f);
      if (recue) pieces.push(recue);
    }
  } catch (e) {
    if (e instanceof PieceRefusee) redirectWithFlash(retour, e.message);
    throw e;
  }

  const maintenant = new Date();
  await prisma.message.create({
    data: {
      threadId,
      auteur: user.nom,
      texte: contenu,
      sentAt: maintenant,
      userId: user.id,
      piecesJointes: { create: pieces },
    },
  });

  // Répondre dans un fil vaut lecture.
  await prisma.participantFil.update({
    where: { threadId_userId: { threadId, userId: user.id } },
    data: { luLe: maintenant },
  });

  revalidatePath("/", "layout");
  redirect(retour);
}

/**
 * Corrige le texte d'un message. Seul son auteur le peut, et le message porte
 * ensuite la mention « modifié » : les autres savent que ce qu'ils lisent
 * n'est plus ce qui a été envoyé.
 */
export async function modifierMessage(formData: FormData) {
  const space = espace(formData);
  const messageId = texte(formData, "messageId");
  const contenu = texte(formData, "texte");

  const user = await getCurrentUser(space);
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      threadId: true,
      userId: true,
      texte: true,
      supprimeLe: true,
      _count: { select: { piecesJointes: true } },
    },
  });
  if (!message || message.userId !== user.id || message.supprimeLe) {
    redirectWithFlash(
      `/${space}/messagerie`,
      "Vous ne pouvez modifier que vos propres messages.",
    );
  }

  const retour = lienFil(space, message.threadId);
  if (contenu === message.texte) redirect(retour);
  if (!contenu && message._count.piecesJointes === 0) {
    redirectWithFlash(
      retour,
      "Un message ne peut pas être vide : supprimez-le plutôt.",
    );
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { texte: contenu, modifieLe: new Date() },
  });

  revalidatePath("/", "layout");
  redirect(retour);
}

/**
 * Supprime un message pour tout le monde. Seul son auteur le peut.
 *
 * Le texte et les pièces disparaissent — fichiers compris —, mais la bulle
 * reste sous la forme « Message supprimé » : une réponse qui suivait garde
 * ainsi son contexte, au lieu de sembler répondre à rien.
 */
export async function supprimerMessage(formData: FormData) {
  const space = espace(formData);
  const messageId = texte(formData, "messageId");

  const user = await getCurrentUser(space);
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      threadId: true,
      userId: true,
      supprimeLe: true,
      piecesJointes: { select: { fichier: true } },
    },
  });
  if (!message || message.userId !== user.id) {
    redirectWithFlash(
      `/${space}/messagerie`,
      "Vous ne pouvez supprimer que vos propres messages.",
    );
  }

  const retour = lienFil(space, message.threadId);
  if (message.supprimeLe) redirect(retour);

  await prisma.$transaction([
    prisma.pieceJointe.deleteMany({ where: { messageId } }),
    prisma.message.update({
      where: { id: messageId },
      data: { texte: "", supprimeLe: new Date(), modifieLe: null },
    }),
  ]);
  // Les fichiers après la base : si l'effacement échouait, il resterait un
  // fichier orphelin, jamais une pièce jointe qui pointe dans le vide.
  await Promise.all(message.piecesJointes.map((p) => effacerPiece(p.fichier)));

  revalidatePath("/", "layout");
  redirect(retour);
}

/**
 * Transfère un message vers d'autres conversations.
 *
 * Chaque cible est soit un fil existant (`fil:<id>`), soit une personne
 * (`personne:<id>`), avec qui l'on retrouve ou l'on ouvre l'échange
 * individuel. Le message est recopié sous le nom de celui qui transfère,
 * marqué « Transféré », avec ses pièces jointes dupliquées.
 */
export async function transfererMessage(formData: FormData) {
  const space = espace(formData);
  const messageId = texte(formData, "messageId");
  const cibles = [...new Set(formData.getAll("cible").map(String))];

  const user = await getCurrentUser(space);
  const source = await prisma.message.findUnique({
    where: { id: messageId },
    include: { piecesJointes: { orderBy: { createdAt: "asc" } } },
  });
  if (
    !source ||
    source.supprimeLe ||
    !(await participe(source.threadId, user.id))
  ) {
    redirectWithFlash(
      `/${space}/messagerie`,
      "Ce message n’est plus disponible.",
    );
  }

  const retour = lienFil(space, source.threadId);
  if (cibles.length === 0) {
    redirectWithFlash(retour, "Choisissez au moins une conversation.");
  }
  if (cibles.length > MAX_CIBLES_TRANSFERT) {
    redirectWithFlash(
      retour,
      `${MAX_CIBLES_TRANSFERT} conversations au plus par transfert.`,
    );
  }

  const fils = cibles
    .filter((c) => c.startsWith("fil:"))
    .map((c) => c.slice(4));
  const personnes = cibles
    .filter((c) => c.startsWith("personne:"))
    .map((c) => c.slice(9));

  const vises = new Set<string>();
  if (fils.length) {
    const miens = await prisma.participantFil.findMany({
      where: { userId: user.id, threadId: { in: fils } },
      select: { threadId: true },
    });
    miens.forEach((p) => vises.add(p.threadId));
  }
  if (personnes.length) {
    const joignables = await prisma.user.findMany({
      where: { AND: [critereJoignable(user.id), { id: { in: personnes } }] },
      select: { id: true },
    });
    for (const p of joignables) vises.add(await filIndividuel(user.id, p.id));
  }
  if (vises.size === 0) {
    redirectWithFlash(
      retour,
      "Aucune des conversations choisies n’est accessible.",
    );
  }

  const maintenant = new Date();
  for (const threadId of vises) {
    const pieces = [];
    for (const p of source.piecesJointes) {
      pieces.push({
        nom: p.nom,
        type: p.type,
        taille: p.taille,
        fichier: await copierPiece(p.fichier),
      });
    }
    await prisma.message.create({
      data: {
        threadId,
        auteur: user.nom,
        userId: user.id,
        texte: source.texte,
        sentAt: maintenant,
        transfere: true,
        piecesJointes: { create: pieces },
      },
    });
  }
  await prisma.participantFil.updateMany({
    where: { userId: user.id, threadId: { in: [...vises] } },
    data: { luLe: maintenant },
  });

  revalidatePath("/", "layout");
  // Vers une seule conversation, on la rejoint ; vers plusieurs, on reste où
  // l'on était, avec la confirmation.
  if (vises.size === 1) redirect(lienFil(space, [...vises][0]));
  redirectWithFlash(
    retour,
    `Message transféré dans ${vises.size} conversations.`,
  );
}

/** Personnes valides parmi celles choisies, l'utilisateur courant exclu. */
async function personnesValides(fd: FormData, userId: string) {
  const ids = [...new Set(fd.getAll("participant").map(String))];
  if (ids.length === 0) return [];
  return prisma.user.findMany({
    where: { AND: [critereJoignable(userId), { id: { in: ids } }] },
    select: { id: true },
  });
}

/** Crée un groupe de discussion avec les personnes choisies. */
export async function creerGroupe(formData: FormData) {
  const space = espace(formData);
  const base = `/${space}/messagerie`;
  const nom = texte(formData, "nom");

  if (!nom) redirectWithFlash(base, "Donnez un nom au groupe.");
  if (nom.length > LONGUEUR_NOM_GROUPE) {
    redirectWithFlash(
      base,
      `Le nom du groupe dépasse ${LONGUEUR_NOM_GROUPE} caractères.`,
    );
  }

  const user = await getCurrentUser(space);
  const invites = await personnesValides(formData, user.id);
  if (invites.length === 0) {
    redirectWithFlash(base, "Ajoutez au moins une personne au groupe.");
  }
  if (invites.length + 1 > MAX_PARTICIPANTS_GROUPE) {
    redirectWithFlash(
      base,
      `Un groupe compte ${MAX_PARTICIPANTS_GROUPE} participants au plus.`,
    );
  }

  let avatar: string | null = null;
  try {
    avatar = await enregistrerImage(formData.get("photo"), {
      prefixe: "groupe",
      largeur: 480,
    });
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithFlash(base, e.message);
    throw e;
  }

  const fil = await prisma.messageThread.create({
    data: {
      type: "groupe",
      nom,
      avatar,
      participants: {
        create: [
          { userId: user.id, luLe: new Date() },
          ...invites.map((i) => ({ userId: i.id })),
        ],
      },
    },
    select: { id: true },
  });

  revalidatePath("/", "layout");
  redirect(lienFil(space, fil.id));
}

/** Ajoute des personnes à un groupe dont on fait partie. */
export async function ajouterParticipants(formData: FormData) {
  const space = espace(formData);
  const threadId = texte(formData, "threadId");
  const retour = lienFil(space, threadId);

  const user = await getCurrentUser(space);
  const fil = await prisma.messageThread.findUnique({
    where: { id: threadId },
    select: { type: true, _count: { select: { participants: true } } },
  });
  if (fil?.type !== "groupe" || !(await participe(threadId, user.id))) {
    redirectWithFlash(
      `/${space}/messagerie`,
      "Seuls les participants d’un groupe peuvent y ajouter quelqu’un.",
    );
  }

  const invites = await personnesValides(formData, user.id);
  if (invites.length === 0) {
    redirectWithFlash(retour, "Choisissez au moins une personne.");
  }
  if (fil._count.participants + invites.length > MAX_PARTICIPANTS_GROUPE) {
    redirectWithFlash(
      retour,
      `Un groupe compte ${MAX_PARTICIPANTS_GROUPE} participants au plus.`,
    );
  }

  // Ceux qui y sont déjà sont ignorés, sans erreur.
  const { count } = await prisma.participantFil.createMany({
    data: invites.map((i) => ({ threadId, userId: i.id })),
    skipDuplicates: true,
  });

  revalidatePath("/", "layout");
  redirectWithFlash(
    retour,
    count === 0
      ? "Ces personnes font déjà partie du groupe."
      : `${count} personne${count > 1 ? "s" : ""} ajoutée${count > 1 ? "s" : ""} au groupe.`,
  );
}

/**
 * Quitter un groupe. Ses messages y restent ; il n'y a simplement plus accès.
 * Le dernier participant parti, le groupe et ses fichiers sont effacés.
 */
export async function quitterGroupe(formData: FormData) {
  const space = espace(formData);
  const threadId = texte(formData, "threadId");
  const base = `/${space}/messagerie`;

  const user = await getCurrentUser(space);
  const fil = await prisma.messageThread.findUnique({
    where: { id: threadId },
    select: { type: true, nom: true },
  });
  if (fil?.type !== "groupe" || !(await participe(threadId, user.id))) {
    redirectWithFlash(base, "Vous ne faites pas partie de ce groupe.");
  }

  await prisma.participantFil.delete({
    where: { threadId_userId: { threadId, userId: user.id } },
  });

  const restants = await prisma.participantFil.count({ where: { threadId } });
  if (restants === 0) {
    const pieces = await prisma.pieceJointe.findMany({
      where: { message: { threadId } },
      select: { fichier: true },
    });
    await prisma.messageThread.delete({ where: { id: threadId } });
    await Promise.all(pieces.map((p) => effacerPiece(p.fichier)));
  }

  revalidatePath("/", "layout");
  redirectWithFlash(base, `Vous avez quitté « ${fil.nom ?? "le groupe"} ».`);
}

/** Marque un fil comme lu par l'utilisateur, à son ouverture. */
export async function markThreadRead(threadId: string, space: Space) {
  const user = await getCurrentUser(space === "admin" ? "admin" : "membre");
  const { count } = await prisma.participantFil.updateMany({
    where: { threadId, userId: user.id },
    data: { luLe: new Date() },
  });
  if (count) revalidatePath("/", "layout");
}

/**
 * Ouvre la conversation avec une entreprise depuis sa fiche d'annuaire.
 *
 * Si l'on échange déjà avec l'une de ses personnes, on y retourne. Sinon le
 * fil s'ouvre avec le contact principal : c'est la personne que l'entreprise
 * désigne comme référente, donc celle qui répondra.
 */
export async function ouvrirConversation(formData: FormData) {
  const memberId = texte(formData, "memberId");
  const space = espace(formData);
  const user = await getCurrentUser(space);

  const existant = await prisma.messageThread.findFirst({
    where: {
      type: "individuel",
      equipe: false,
      AND: [
        { participants: { some: { userId: user.id } } },
        {
          participants: {
            some: { userId: { not: user.id }, user: { memberId } },
          },
        },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (existant) redirect(lienFil(space, existant.id));

  // L'équipe écrit aussi aux candidats et aux adhésions en attente, que la
  // messagerie des membres ne propose pas encore.
  const referent = await prisma.user.findFirst({
    where:
      space === "admin"
        ? // Le demandeur d'une adhésion n'a encore qu'un compte visiteur :
          // c'est pourtant lui que l'équipe doit pouvoir joindre.
          { memberId, role: { in: ["membre" as const, "visiteur" as const] } }
        : { AND: [critereJoignable(user.id), { memberId }] },
    orderBy: [{ contactPrincipal: "desc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!referent) {
    redirectWithFlash(
      space === "admin"
        ? `/admin/membres/${memberId}`
        : `/membre/annuaire/${memberId}`,
      "Cette entreprise n’a pas encore de contact joignable par la messagerie.",
    );
  }

  const threadId = await filIndividuel(user.id, referent.id);
  revalidatePath("/", "layout");
  redirect(lienFil(space, threadId));
}

/**
 * Formulaire de contact de l'équipe.
 *
 * La demande n'atterrit pas dans une boîte à part : elle est postée dans le
 * fil d'assistance du membre. L'équipe la voit là où elle répond déjà aux
 * membres, et le membre retrouve la réponse dans la même conversation — sans
 * nouvel outil à surveiller de part et d'autre.
 */
export async function envoyerDemandeContact(formData: FormData) {
  const motif = texte(formData, "motif");
  const sujet = texte(formData, "sujet");
  const contenu = texte(formData, "message");
  const rappel = texte(formData, "rappel");

  if (!sujet || !contenu) {
    redirectWithFlash(
      "/membre/contact",
      "Merci d’indiquer un sujet et un message.",
    );
  }

  const user = await getCurrentUser("membre");

  const motifRetenu = (MOTIFS_CONTACT as readonly string[]).includes(motif)
    ? motif
    : "Autre demande";

  const fil = await ecrireAEquipe(
    user,
    [
      `${motifRetenu} — ${sujet}`,
      contenu,
      rappel ? `Rappel souhaité au ${rappel}.` : null,
    ]
      .filter(Boolean)
      .join("\n\n"),
  );

  revalidatePath("/", "layout");
  redirect(`/membre/contact?envoye=${fil}`);
}

/**
 * Réservation d'un service payant de la chambre.
 *
 * Un clic suffit : le message part tout rédigé dans le fil de l'équipe, qui
 * répond avec les modalités de règlement. Le paiement en ligne n'étant pas
 * branché, c'est l'équipe qui encaisse et émet la facture. La demande laisse
 * aussi une trace au journal, pour qu'aucune ne se perde entre deux
 * permanences.
 */
export async function reserverService(formData: FormData) {
  const retour = "/membre/offres-cancham";
  const service = await prisma.canchamService.findUnique({
    where: { id: texte(formData, "serviceId") },
    select: { id: true, titre: true, type: true, prix: true },
  });
  if (!service || service.type !== "payant") {
    redirectWithFlash(retour, "Ce service n’est plus proposé.");
  }

  const user = await getCurrentUser("membre");
  const entreprise = user.memberId
    ? (
        await prisma.member.findUnique({
          where: { id: user.memberId },
          select: { nom: true },
        })
      )?.nom
    : null;
  const prix = fmtMoney(service.prix);

  const fil = await ecrireAEquipe(
    user,
    [
      `Réservation et paiement — ${service.titre}`,
      `Bonjour, je souhaite réserver « ${service.titre} » (${prix}). Pouvez-vous m’indiquer les modalités de règlement et la suite à donner ?`,
      [user.nom, entreprise].filter(Boolean).join(" · "),
    ].join("\n\n"),
  );

  await prisma.auditLog.create({
    data: {
      action: "service_reserve",
      entite: "MessageThread",
      entiteId: fil,
      acteur: user.nom,
      detail: `« ${service.titre} » · ${prix}${entreprise ? ` · ${entreprise}` : ""}.`,
    },
  });

  revalidatePath("/", "layout");
  redirectWithFlash(
    retour,
    `Demande envoyée à l’équipe CanCham · réponse dans votre messagerie`,
  );
}
