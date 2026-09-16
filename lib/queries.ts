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
  Contact,
  CanchamService,
  Comment,
  Invoice,
  Member,
  MessageThread,
  NewsItem,
  Offer,
  Registration,
  Resource,
  Space,
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
  cover: string | null;
  photo: string | null;
  logo: string | null;
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
    cover: m.cover,
    photo: m.photo,
    logo: m.logo,
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
    include: {
      _count: { select: { participants: true } },
      programme: { orderBy: { ordre: "asc" } },
    },
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
    heure: e.heure,
    pourQui: e.pourQui,
    programme: e.programme.map((etape) => ({
      heure: etape.heure,
      titre: etape.titre,
      detail: etape.detail,
    })),
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
    image: n.image,
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
    image: n.image,
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
    // La vignette de l'offre reprend la couverture de l'entreprise : c'est elle
    // qui donne le contexte, avant même d'avoir lu le nom.
    include: { member: { select: { nom: true, cover: true, photo: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((o) => ({
    id: o.id,
    membreId: o.memberId,
    membre: o.member.nom,
    titre: o.titre,
    desc: o.desc,
    cover: o.member.cover,
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
    avatar: t.avatar,
    memberId: t.memberId,
    unread: t.unread,
    messages: t.messages.map((m) => ({
      id: m.id,
      de: m.auteur,
      moi: m.userId === currentUserId,
      texte: m.texte,
      heure: heureRelative(m.sentAt),
      envoyeLe: m.sentAt.toISOString(),
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

/* ============================ Recherche ============================ */

export interface ResultatRecherche {
  type: "membre" | "evenement" | "actualite" | "ressource";
  id: string;
  titre: string;
  detail: string;
  href: string;
}

/**
 * Recherche transversale : annuaire, événements, actualités, ressources.
 *
 * Insensible à la casse et aux fragments — « tana » trouve Antananarivo. Les
 * candidatures restent exclues de l'annuaire côté membre.
 */
export async function rechercher(
  q: string,
  space: Space,
): Promise<ResultatRecherche[]> {
  const terme = q.trim();
  if (terme.length < 2) return [];

  const like = { contains: terme, mode: "insensitive" } as const;
  const base = space === "admin" ? "/admin" : "/membre";

  const [membres, evenements, actualites, ressources] = await Promise.all([
    prisma.member.findMany({
      where: {
        ...(space === "admin" ? {} : { statut: { not: "candidature" as const } }),
        OR: [
          { nom: like },
          { secteur: like },
          { ville: like },
          { activite: like },
          { desc: like },
        ],
      },
      select: { id: true, nom: true, secteur: true, ville: true },
      take: 8,
      orderBy: { nom: "asc" },
    }),
    prisma.event.findMany({
      where: { OR: [{ titre: like }, { lieu: like }, { desc: like }] },
      select: { id: true, titre: true, lieu: true, date: true },
      take: 8,
      orderBy: { date: "desc" },
    }),
    prisma.news.findMany({
      where: { OR: [{ titre: like }, { extrait: like }, { corps: like }] },
      select: { id: true, titre: true, date: true },
      take: 8,
      orderBy: { date: "desc" },
    }),
    prisma.resource.findMany({
      where: { titre: like },
      select: { id: true, titre: true, taille: true, type: true },
      take: 8,
      orderBy: { date: "desc" },
    }),
  ]);

  return [
    ...membres.map((m) => ({
      type: "membre" as const,
      id: m.id,
      titre: m.nom,
      detail: `${m.secteur} · ${m.ville}`,
      // Le back-office ouvre la fiche de gestion, le membre la fiche d'annuaire.
      href: space === "admin" ? `/admin/membres/${m.id}` : `/membre/annuaire/${m.id}`,
    })),
    ...evenements.map((e) => ({
      type: "evenement" as const,
      id: e.id,
      titre: e.titre,
      detail: `${e.lieu} · ${toISODate(e.date)}`,
      href: space === "admin" ? `/admin/evenements` : `/membre/evenements/${e.id}`,
    })),
    ...actualites.map((n) => ({
      type: "actualite" as const,
      id: n.id,
      titre: n.titre,
      detail: toISODate(n.date),
      href: `${base}/actualites/${n.id}`,
    })),
    ...ressources.map((r) => ({
      type: "ressource" as const,
      id: r.id,
      titre: r.titre,
      detail: `${r.taille} · ${r.type}`,
      href: `${base}/ressources`,
    })),
  ];
}

/* ============================ Espace public ============================ */

export interface StatsPubliques {
  membres: number;
  secteurs: number;
  villes: number;
  evenementsAVenir: number;
}

/**
 * Chiffres du bandeau de la page d'accueil publique.
 *
 * Ils sont comptés en base plutôt qu'écrits en dur : la vitrine dit ce que
 * l'annuaire contient réellement, et se met à jour toute seule à mesure que
 * la chambre recrute.
 */
export async function getStatsPubliques(): Promise<StatsPubliques> {
  const [membres, groupes, evenements] = await Promise.all([
    prisma.member.count({ where: { statut: { not: "candidature" } } }),
    prisma.member.findMany({
      where: { statut: { not: "candidature" } },
      select: { secteur: true, ville: true },
    }),
    prisma.event.count({ where: { date: { gte: new Date() } } }),
  ]);

  return {
    membres,
    secteurs: new Set(groupes.map((g) => g.secteur)).size,
    villes: new Set(groupes.map((g) => g.ville)).size,
    evenementsAVenir: evenements,
  };
}

/** Secteurs représentés, pour le menu déroulant du formulaire d'adhésion. */
export async function getSecteurs(): Promise<string[]> {
  const rows = await prisma.member.findMany({
    where: { statut: { not: "candidature" } },
    select: { secteur: true },
    distinct: ["secteur"],
    orderBy: { secteur: "asc" },
  });
  return rows.map((r) => r.secteur);
}

/** Les prochains rendez-vous mis en avant sur la page publique. */
export async function getProchainsEvenements(n = 3): Promise<CanchamEvent[]> {
  const rows = await prisma.event.findMany({
    where: { date: { gte: new Date() } },
    include: { _count: { select: { participants: true } } },
    orderBy: { date: "asc" },
    take: n,
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

/**
 * Entreprises déjà inscrites à un événement.
 *
 * On renvoie les noms d'entreprise dédupliqués, pas les personnes : un membre
 * qui consulte la fiche veut savoir qui sera dans la salle, pas qui exactement
 * son homologue a envoyé. `total` compte les entreprises distinctes, pas les
 * participants — deux nombres différents, et c'est voulu.
 */
export async function getEntreprisesInscrites(
  eventId: string,
  n = 12,
): Promise<{ noms: string[]; total: number }> {
  const rows = await prisma.attendee.findMany({
    where: { eventId },
    select: { entreprise: true },
    distinct: ["entreprise"],
    orderBy: { entreprise: "asc" },
  });
  const noms = rows.map((r) => r.entreprise);
  return { noms: noms.slice(0, n), total: noms.length };
}

/**
 * Contacts d'une entreprise.
 *
 * Le contact principal remonte en tête : c'est lui que la chambre appelle en
 * premier, et l'ordre de la liste doit le dire sans qu'on ait à lire les
 * pastilles. Les autres suivent par ancienneté.
 */
export async function getContacts(memberId: string): Promise<Contact[]> {
  const rows = await prisma.user.findMany({
    where: { memberId },
    orderBy: [{ contactPrincipal: "desc" }, { createdAt: "asc" }],
  });
  return rows.map((u) => ({
    id: u.id,
    nom: u.nom,
    fonction: u.fonction,
    email: u.email,
    tel: u.tel,
    photo: u.photo,
    principal: u.contactPrincipal,
  }));
}
