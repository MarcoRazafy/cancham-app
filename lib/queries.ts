import "server-only";

import { prisma } from "@/lib/db";
import {
  EVENT_FORMAT_LABEL,
  heureRelative,
  NEWS_CAT_LABEL,
  RESOURCE_CAT_LABEL,
  RESOURCE_FMT_LABEL,
  toISODate,
} from "@/lib/enums";
import type {
  CanchamEvent,
  CanchamService,
  Comment,
  Invoice,
  Member,
  MessageThread,
  NewsItem,
  Offer,
  Registration,
  Resource,
} from "@/lib/types";

/**
 * Accès aux données.
 *
 * Chaque fonction lit la base et rend le modèle de vue défini dans `lib/types.ts`
 * — les composants ne connaissent donc pas Prisma, et n'ont pas eu à changer
 * lors de la bascule depuis les données en dur.
 */

/* ============================ Membres ============================ */

const membreInclude = { produits: { orderBy: { ordre: "asc" } } } as const;

type MembreRow = {
  id: string;
  type: "morale" | "physique";
  nom: string;
  secteur: string;
  ville: string;
  statut: "candidature" | "en_attente" | "a_jour" | "en_retard";
  adhesion: Date;
  retardDepuis: Date | null;
  activite: string;
  desc: string;
  besoins: string | null;
  interets: string | null;
  statutJuridique: string | null;
  pays: string | null;
  siteweb: string | null;
  motivation: string | null;
  paiementNote: string | null;
  produits: { label: string; photo: string | null }[];
};

function versMembre(m: MembreRow): Member {
  return {
    id: m.id,
    type: m.type,
    nom: m.nom,
    secteur: m.secteur,
    ville: m.ville,
    statut: m.statut,
    adhesion: toISODate(m.adhesion),
    retardDepuis: m.retardDepuis ? toISODate(m.retardDepuis) : null,
    activite: m.activite,
    desc: m.desc,
    besoins: m.besoins ?? undefined,
    interets: m.interets ?? undefined,
    statutJuridique: m.statutJuridique ?? undefined,
    pays: m.pays ?? undefined,
    siteweb: m.siteweb ?? undefined,
    motivation: m.motivation ?? undefined,
    paiementNote: m.paiementNote ?? undefined,
    produits: m.produits.map((p) => ({ label: p.label, photo: p.photo })),
  };
}

/** Tous les membres, candidatures comprises. Classés par nom. */
export async function getMembers(): Promise<Member[]> {
  const rows = await prisma.member.findMany({
    include: membreInclude,
    orderBy: { nom: "asc" },
  });
  return rows.map(versMembre);
}

/** Les membres visibles dans l'annuaire : une candidature n'en est pas encore un. */
export async function getMembresAnnuaire(): Promise<Member[]> {
  const rows = await prisma.member.findMany({
    where: { statut: { not: "candidature" } },
    include: membreInclude,
    orderBy: { nom: "asc" },
  });
  return rows.map(versMembre);
}

export async function getMember(id: string): Promise<Member | null> {
  const row = await prisma.member.findUnique({
    where: { id },
    include: membreInclude,
  });
  return row ? versMembre(row) : null;
}

/* ============================ Événements ============================ */

/**
 * Le nombre d'inscrits n'est pas stocké : il se compte depuis les participants.
 * C'est ce qui évite qu'un compteur figé s'écarte de la liste réelle.
 */
export async function getEvents(): Promise<CanchamEvent[]> {
  const rows = await prisma.event.findMany({
    include: { _count: { select: { participants: true } } },
    orderBy: { date: "asc" },
  });
  return rows.map((e) => ({
    id: e.id,
    titre: e.titre,
    date: toISODate(e.date),
    lieu: e.lieu,
    format: EVENT_FORMAT_LABEL[e.format],
    cap: e.cap,
    inscrits: e._count.participants,
    payant: e.payant,
    prix: e.prix,
    desc: e.desc,
    photo: e.photo,
  }));
}

export async function getEvent(id: string): Promise<CanchamEvent | null> {
  const e = await prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { participants: true } } },
  });
  if (!e) return null;
  return {
    id: e.id,
    titre: e.titre,
    date: toISODate(e.date),
    lieu: e.lieu,
    format: EVENT_FORMAT_LABEL[e.format],
    cap: e.cap,
    inscrits: e._count.participants,
    payant: e.payant,
    prix: e.prix,
    desc: e.desc,
    photo: e.photo,
  };
}

export async function getRegistrations(memberId: string): Promise<Registration[]> {
  const rows = await prisma.registration.findMany({
    where: { memberId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    eventId: r.eventId,
    memberId: r.memberId,
    code: r.code,
    date: toISODate(r.createdAt),
  }));
}

export async function getRegistration(
  eventId: string,
  memberId: string | null,
): Promise<Registration | null> {
  if (!memberId) return null;
  const r = await prisma.registration.findUnique({
    where: { eventId_memberId: { eventId, memberId } },
  });
  return r
    ? { eventId: r.eventId, memberId: r.memberId, code: r.code, date: toISODate(r.createdAt) }
    : null;
}

/* ============================ Contenus ============================ */

type CommentRow = {
  id: string;
  auteur: string;
  entreprise: string;
  texte: string;
  date: Date;
};

const versCommentaires = (cs: CommentRow[]): Comment[] =>
  cs.map((c) => ({
    id: c.id,
    auteur: c.auteur,
    entreprise: c.entreprise,
    texte: c.texte,
    date: toISODate(c.date),
  }));

export async function getNews(): Promise<NewsItem[]> {
  const rows = await prisma.news.findMany({
    include: { commentaires: { orderBy: { date: "asc" } } },
    orderBy: { date: "desc" },
  });
  return rows.map((n) => ({
    id: n.id,
    titre: n.titre,
    date: toISODate(n.date),
    cat: NEWS_CAT_LABEL[n.cat],
    media: {
      type: n.mediaType,
      theme: n.mediaTheme,
      duration: n.mediaDuration ?? undefined,
    },
    extrait: n.extrait,
    corps: n.corps,
    commentaires: versCommentaires(n.commentaires),
  }));
}

export async function getNewsItem(id: string): Promise<NewsItem | null> {
  const n = await prisma.news.findUnique({
    where: { id },
    include: { commentaires: { orderBy: { date: "asc" } } },
  });
  if (!n) return null;
  return {
    id: n.id,
    titre: n.titre,
    date: toISODate(n.date),
    cat: NEWS_CAT_LABEL[n.cat],
    media: {
      type: n.mediaType,
      theme: n.mediaTheme,
      duration: n.mediaDuration ?? undefined,
    },
    extrait: n.extrait,
    corps: n.corps,
    commentaires: versCommentaires(n.commentaires),
  };
}

export async function getResources(type?: "gratuit" | "payant"): Promise<Resource[]> {
  const rows = await prisma.resource.findMany({
    where: type ? { type } : undefined,
    include: { commentaires: { orderBy: { date: "asc" } } },
    orderBy: { date: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    titre: r.titre,
    cat: RESOURCE_CAT_LABEL[r.cat],
    fmt: RESOURCE_FMT_LABEL[r.fmt],
    taille: r.taille,
    date: toISODate(r.date),
    type: r.type,
    prix: r.prix,
    commentaires: versCommentaires(r.commentaires),
  }));
}

/** Compte des ressources par tarif, pour les onglets. */
export async function getResourceCounts() {
  const [tout, gratuit, payant] = await Promise.all([
    prisma.resource.count(),
    prisma.resource.count({ where: { type: "gratuit" } }),
    prisma.resource.count({ where: { type: "payant" } }),
  ]);
  return { tout, gratuit, payant };
}

/* ============================ Offres & services ============================ */

export async function getOffers(): Promise<Offer[]> {
  const rows = await prisma.offer.findMany({
    include: { member: { select: { nom: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((o) => ({
    id: o.id,
    membreId: o.memberId,
    membre: o.member.nom,
    titre: o.titre,
    desc: o.desc,
  }));
}

export async function getServices(): Promise<CanchamService[]> {
  const rows = await prisma.canchamService.findMany({ orderBy: { ordre: "asc" } });
  return rows.map((s) => ({
    id: s.id,
    titre: s.titre,
    desc: s.desc,
    type: s.type,
    prix: s.prix,
    icon: s.icon,
  }));
}

/* ============================ Facturation ============================ */

export async function getInvoices(memberId?: string): Promise<Invoice[]> {
  const rows = await prisma.invoice.findMany({
    where: memberId ? { memberId } : undefined,
    include: { member: { select: { nom: true } } },
    orderBy: { date: "desc" },
  });
  return rows.map((f) => ({
    id: f.id,
    numero: f.numero,
    date: toISODate(f.date),
    objet: f.objet,
    montant: f.montant,
    statut: f.statut,
    membreId: f.memberId,
    membre: f.member.nom,
  }));
}

/** Total encaissé, calculé par la base plutôt qu'en mémoire. */
export async function getEncaisse(): Promise<number> {
  const { _sum } = await prisma.invoice.aggregate({
    where: { statut: "payee" },
    _sum: { montant: true },
  });
  return _sum.montant ?? 0;
}

/* ============================ Messagerie ============================ */

export async function getThreads(currentUserId: string): Promise<MessageThread[]> {
  const rows = await prisma.messageThread.findMany({
    include: { messages: { orderBy: { sentAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((t) => ({
    id: t.id,
    type: t.type,
    nom: t.nom,
    sousTitre: t.sousTitre,
    init: t.init,
    unread: t.unread,
    messages: t.messages.map((m) => ({
      id: m.id,
      de: m.auteur,
      moi: m.userId === currentUserId,
      texte: m.texte,
      heure: heureRelative(m.sentAt),
    })),
  }));
}

export async function getUnreadTotal(): Promise<number> {
  const { _sum } = await prisma.messageThread.aggregate({ _sum: { unread: true } });
  return _sum.unread ?? 0;
}

/* ============================ Tableau de bord ============================ */

/** Répartition des adhésions, comptée par la base. */
export async function getMemberStats() {
  const rows = await prisma.member.groupBy({
    by: ["statut"],
    _count: { _all: true },
  });
  const par = (s: string) => rows.find((r) => r.statut === s)?._count._all ?? 0;
  return {
    total: rows.reduce((sum, r) => sum + r._count._all, 0),
    aJour: par("a_jour"),
    enAttente: par("en_attente"),
    enRetard: par("en_retard"),
    candidatures: par("candidature"),
  };
}

/** Membres qui demandent une action de l'équipe. */
export async function getMembresATraiter(): Promise<Member[]> {
  const rows = await prisma.member.findMany({
    where: { statut: { not: "a_jour" } },
    include: membreInclude,
    orderBy: { nom: "asc" },
  });
  return rows.map(versMembre);
}
