import "server-only";

import {
  ADHESION_PENDING,
  DELAI_REGLEMENT_JOURS,
  fmtMontant,
  RETARD_BLOCAGE_JOURS,
  type FormuleId,
} from "@/lib/membership";
import {
  ajouterJours,
  dateRestriction,
  echeanceCotisation,
  echeanceFacture,
  trierElements,
  type ElementAgenda,
} from "@/lib/agenda";

import { PROVISOIRE } from "@/lib/accueil";
import { initialesDe, LOGO_EQUIPE } from "@/lib/avatars";
import { codeInscription, extraireCode } from "@/lib/codes-accueil";
import { prisma } from "@/lib/db";
import { nomFacture } from "@/lib/factures";
import { aujourdhuiISO, jourBase } from "@/lib/format";
import { critereJoignable } from "@/lib/messagerie";
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
  NewsCategory,
  NewsItem,
  Personne,
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
  formule: FormuleId;
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
  accueilEnCours: boolean;
  produits: {
    id: string;
    label: string;
    type: "produit" | "service";
    description: string | null;
    prix: string | null;
    photos: string[];
  }[];
};

function versMembre(m: MembreRow): Member {
  return {
    id: m.id,
    type: m.type,
    nom: m.nom,
    secteur: m.secteur,
    ville: m.ville,
    statut: m.statut,
    formule: m.formule,
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
    accueilEnCours: m.accueilEnCours,
    produits: m.produits.map((p) => ({
      id: p.id,
      label: p.label,
      type: p.type,
      description: p.description,
      prix: p.prix,
      photos: p.photos,
    })),
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
    public: e.public,
    prixPublic: e.prixPublic,
    desc: e.desc,
    photo: e.photo,
    debut: e.debut,
    fin: e.fin,
  }));
}

/**
 * Les billets d'une inscription publique, retrouvés par son code : celui du
 * lien de l'e-mail de confirmation, qui fait office de clé. Le code d'une
 * inscription de membre n'ouvre rien ici — ses billets sont dans son espace.
 */
export async function getBilletsPublics(eventId: string, code: string) {
  const base = codeInscription(extraireCode(code));
  if (!/^CC-[A-Z0-9]+-[A-Z0-9]{4,8}$/.test(base)) return [];
  const [membre, lignes] = await Promise.all([
    prisma.registration.findUnique({
      where: { code: base },
      select: { id: true },
    }),
    prisma.attendee.findMany({
      where: {
        eventId,
        OR: [{ code: base }, { code: { startsWith: `${base}-` } }],
      },
      orderBy: { createdAt: "asc" },
      select: {
        nom: true,
        entreprise: true,
        email: true,
        code: true,
        statut: true,
      },
    }),
  ]);
  if (membre) return [];
  return lignes.flatMap((l) => (l.code ? [{ ...l, code: l.code }] : []));
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
    public: e.public,
    prixPublic: e.prixPublic,
    desc: e.desc,
    photo: e.photo,
    debut: e.debut,
    fin: e.fin,
    pourQui: e.pourQui,
    programme: e.programme.map((etape) => ({
      heure: etape.heure,
      titre: etape.titre,
      detail: etape.detail,
    })),
  };
}

export async function getRegistrations(
  memberId: string,
): Promise<Registration[]> {
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
  if (!r) return null;
  // Les lignes d'accueil de l'inscription : son code, puis « -2 », « -3 »…
  const lignes = await prisma.attendee.findMany({
    where: {
      eventId,
      OR: [{ code: r.code }, { code: { startsWith: `${r.code}-` } }],
    },
    select: { nom: true, code: true },
  });
  // Dans l'ordre des rangs : « -10 » vient après « -2 », pas avant.
  const rang = (c: string | null) =>
    c === r.code ? 1 : Number(c?.slice(r.code.length + 1)) || 0;
  lignes.sort((a, b) => rang(a.code) - rang(b.code));
  return {
    eventId: r.eventId,
    memberId: r.memberId,
    code: r.code,
    date: toISODate(r.createdAt),
    // Une inscription d'avant les représentants n'a que son propre code.
    representants: lignes.length
      ? lignes.map((l) => ({ nom: l.nom, code: l.code ?? r.code }))
      : [{ nom: "", code: r.code }],
  };
}

/* ============================ Contenus ============================ */

/**
 * Ce qu'on charge avec un commentaire : ses « j'aime » comptés, et celui de
 * l'utilisateur courant s'il en a posé un.
 */
function commentairesInclude(userId?: string) {
  return {
    orderBy: { createdAt: "asc" as const },
    include: {
      _count: { select: { jaimes: true } },
      jaimes: { where: { userId: userId ?? "" }, select: { id: true } },
    },
  };
}

type CommentRow = {
  id: string;
  auteur: string;
  entreprise: string;
  texte: string;
  date: Date;
  userId: string | null;
  modifieLe: Date | null;
  _count: { jaimes: number };
  jaimes: { id: string }[];
};

const versCommentaires = (cs: CommentRow[], userId?: string): Comment[] =>
  cs.map((c) => ({
    id: c.id,
    auteur: c.auteur,
    entreprise: c.entreprise,
    texte: c.texte,
    date: toISODate(c.date),
    moi: Boolean(userId) && c.userId === userId,
    modifie: Boolean(c.modifieLe),
    jaimes: c._count.jaimes,
    jaimeParMoi: c.jaimes.length > 0,
  }));

/**
 * Ce qu'on charge avec une publication.
 *
 * Les « j'aime » ne remontent pas en entier : seul le compte est utile, plus
 * la ligne de l'utilisateur courant s'il en a posé une — une liste filtrée
 * sur lui, vide ou d'un élément, qui dit « déjà aimé » sans rien trier en
 * mémoire.
 */
function newsInclude(userId?: string) {
  return {
    commentaires: commentairesInclude(userId),
    _count: { select: { jaimes: true } },
    jaimes: { where: { userId: userId ?? "" }, select: { id: true } },
  };
}

type NewsRow = Awaited<
  ReturnType<
    typeof prisma.news.findMany<{ include: ReturnType<typeof newsInclude> }>
  >
>[number];

function versNews(n: NewsRow, userId?: string): NewsItem {
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
    public: n.public,
    images: n.images,
    commentaires: versCommentaires(n.commentaires, userId),
    jaimes: n._count.jaimes,
    jaimeParMoi: n.jaimes.length > 0,
  };
}

/** Fil d'actualité, du plus récent au plus ancien. */
export async function getNews(userId?: string): Promise<NewsItem[]> {
  const rows = await prisma.news.findMany({
    include: newsInclude(userId),
    orderBy: { date: "desc" },
  });
  return rows.map((n) => versNews(n, userId));
}

export async function getNewsItem(
  id: string,
  userId?: string,
): Promise<NewsItem | null> {
  const n = await prisma.news.findUnique({
    where: { id },
    include: newsInclude(userId),
  });
  return n ? versNews(n, userId) : null;
}

/** Une actualité telle que la page publique la montre : sans commentaires ni « j'aime ». */
export interface ActualitePublique {
  id: string;
  titre: string;
  date: string;
  cat: NewsCategory;
  extrait: string;
  corps: string;
  images: string[];
}

function versActualitePublique(n: {
  id: string;
  titre: string;
  date: Date;
  cat: keyof typeof NEWS_CAT_LABEL;
  extrait: string;
  corps: string;
  images: string[];
}): ActualitePublique {
  return {
    id: n.id,
    titre: n.titre,
    date: toISODate(n.date),
    cat: NEWS_CAT_LABEL[n.cat],
    extrait: n.extrait,
    corps: n.corps,
    images: n.images,
  };
}

const CHAMPS_ACTUALITE_PUBLIQUE = {
  id: true,
  titre: true,
  date: true,
  cat: true,
  extrait: true,
  corps: true,
  images: true,
} as const;

/** Les dernières actualités diffusées sur la page publique. */
export async function getActualitesPubliques(
  n = 3,
): Promise<ActualitePublique[]> {
  const rows = await prisma.news.findMany({
    where: { public: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: n,
    select: CHAMPS_ACTUALITE_PUBLIQUE,
  });
  return rows.map(versActualitePublique);
}

/** Une actualité de la page publique ; `null` si elle est réservée aux membres. */
export async function getActualitePublique(
  id: string,
): Promise<ActualitePublique | null> {
  const n = await prisma.news.findFirst({
    where: { id, public: true },
    select: CHAMPS_ACTUALITE_PUBLIQUE,
  });
  return n ? versActualitePublique(n) : null;
}

/** Y a-t-il au moins une actualité sur la page publique ? */
export async function aDesActualitesPubliques(): Promise<boolean> {
  return (await prisma.news.count({ where: { public: true } })) > 0;
}

export async function getResources(
  type?: "gratuit" | "payant",
): Promise<Resource[]> {
  const rows = await prisma.resource.findMany({
    where: type ? { type } : undefined,
    include: { commentaires: commentairesInclude() },
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
    cover: r.cover,
    pret: Boolean(r.fichier) && (r.fmt === "video" || Boolean(r.pages)),
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
  return rows.map(versOffre);
}

/** Les offres les plus récentes, pour le tableau de bord. */
export async function getDernieresOffres(n = 3): Promise<Offer[]> {
  const rows = await prisma.offer.findMany({
    include: { member: { select: { nom: true, cover: true, photo: true } } },
    orderBy: { createdAt: "desc" },
    take: n,
  });
  return rows.map(versOffre);
}

function versOffre(o: {
  id: string;
  memberId: string;
  titre: string;
  desc: string;
  image: string | null;
  member: { nom: string; cover: string | null };
}): Offer {
  return {
    id: o.id,
    membreId: o.memberId,
    membre: o.member.nom,
    titre: o.titre,
    desc: o.desc,
    image: o.image,
    cover: o.image ?? o.member.cover,
  };
}

export async function getServices(): Promise<CanchamService[]> {
  const rows = await prisma.canchamService.findMany({
    orderBy: { ordre: "asc" },
  });
  return rows.map((s) => ({
    id: s.id,
    titre: s.titre,
    desc: s.desc,
    type: s.type,
    prix: s.prix,
    icon: s.icon,
    image: s.image,
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
    devise: f.devise,
    statut: f.statut,
    membreId: f.memberId,
    membre: nomFacture(f),
  }));
}

/** Total encaissé, calculé par la base plutôt qu'en mémoire. */
/**
 * Montants encaissés, un total par devise.
 *
 * Une somme unique additionnerait des Ariary et des dollars canadiens : le
 * chiffre n'aurait ni unité ni sens, et une cotisation à 1 000 $ y pèserait
 * autant qu'une à 1 000 Ar.
 */
export async function getEncaisse(): Promise<Record<"MGA" | "CAD", number>> {
  const rows = await prisma.invoice.groupBy({
    by: ["devise"],
    where: { statut: "payee" },
    _sum: { montant: true },
  });
  const total = (d: "MGA" | "CAD") =>
    rows.find((r) => r.devise === d)?._sum.montant ?? 0;
  return { MGA: total("MGA"), CAD: total("CAD") };
}

/* ============================ Agenda ============================ */

/** Une facture de cotisation, reconnue à son objet — comme au règlement. */
const OBJET_COTISATION = {
  startsWith: "Cotisation",
  mode: "insensitive",
} as const;

/** Années dont la cotisation est réglée : une facture de cotisation payée. */
export async function getAnneesCotisationReglees(
  memberId: string,
): Promise<number[]> {
  const rows = await prisma.invoice.findMany({
    where: { memberId, statut: "payee", objet: OBJET_COTISATION },
    select: { date: true },
  });
  return [...new Set(rows.map((f) => f.date.getUTCFullYear()))];
}

/**
 * Tout ce qui tombe entre deux jours dans l'agenda d'un membre.
 *
 * Seuls les rappels sont stockés pour l'agenda : les événements se lisent dans
 * leur table, et les échéances se calculent — factures à régler, renouvellement
 * annuel, fin du délai de grâce d'un retard. Rien à tenir à jour, donc rien qui
 * puisse diverger de la réalité.
 */
export async function getAgenda(
  { userId, memberId }: { userId: string; memberId: string | null },
  du: string,
  au: string,
): Promise<ElementAgenda[]> {
  const aujourdhui = aujourdhuiISO();
  const periode = { gte: jourBase(du), lte: jourBase(au) };

  const [evenements, factures, membre, reglees, rappels] = await Promise.all([
    prisma.event.findMany({
      where: { date: periode },
      select: {
        id: true,
        titre: true,
        date: true,
        debut: true,
        fin: true,
        lieu: true,
        format: true,
        inscriptions: memberId
          ? { where: { memberId }, select: { id: true } }
          : false,
      },
    }),
    memberId
      ? prisma.invoice.findMany({
          where: {
            memberId,
            statut: "envoyee",
            // L'échéance tombe dans la période : la facture a été émise
            // `DELAI_REGLEMENT_JOURS` jours plus tôt.
            date: {
              gte: jourBase(ajouterJours(du, -DELAI_REGLEMENT_JOURS)),
              lte: jourBase(ajouterJours(au, -DELAI_REGLEMENT_JOURS)),
            },
          },
          select: {
            id: true,
            numero: true,
            date: true,
            objet: true,
            montant: true,
            devise: true,
          },
        })
      : [],
    memberId
      ? prisma.member.findUnique({
          where: { id: memberId },
          select: { statut: true, adhesion: true, retardDepuis: true },
        })
      : null,
    memberId ? getAnneesCotisationReglees(memberId) : ([] as number[]),
    rappelsAgenda(userId, du, au),
  ]);

  const elements: ElementAgenda[] = [];

  for (const e of evenements) {
    const inscrit = Array.isArray(e.inscriptions) && e.inscriptions.length > 0;
    elements.push({
      id: `evenement-${e.id}`,
      type: inscrit ? "inscription" : "evenement",
      titre: e.titre,
      jour: toISODate(e.date),
      debut: e.debut,
      fin: e.fin,
      lieu: e.lieu,
      detail: EVENT_FORMAT_LABEL[e.format],
      href: `/membre/evenements/${e.id}`,
    });
  }

  for (const f of factures) {
    const jour = echeanceFacture(toISODate(f.date));
    elements.push({
      id: `facture-${f.id}`,
      type: "echeance",
      titre: `Facture ${f.numero} à régler`,
      jour,
      debut: null,
      fin: null,
      detail: `${f.objet} · ${fmtMontant(f.montant, f.devise)}`,
      href: `/membre/cotisations/${f.id}`,
      urgent: jour < aujourdhui,
    });
  }

  if (membre && !ADHESION_PENDING.includes(membre.statut)) {
    const premiere = membre.adhesion.getUTCFullYear() + 1;
    for (
      let annee = Math.max(Number(du.slice(0, 4)), premiere);
      annee <= Number(au.slice(0, 4));
      annee++
    ) {
      const jour = echeanceCotisation(annee);
      if (jour < du || jour > au) continue;
      // Une échéance passée d'un membre à jour est réglée, même sans facture
      // enregistrée ici : le statut fait foi.
      const reglee =
        reglees.includes(annee) ||
        (jour < aujourdhui && membre.statut === "a_jour");
      elements.push({
        id: `cotisation-${annee}`,
        type: "echeance",
        titre: `Renouvellement de la cotisation ${annee}`,
        jour,
        debut: null,
        fin: null,
        detail: reglee ? "Réglée" : "Cotisation annuelle",
        href: "/membre/cotisations",
        fait: reglee,
        urgent: !reglee && jour < aujourdhui,
      });
    }
  }

  if (membre?.statut === "en_retard" && membre.retardDepuis) {
    const jour = dateRestriction(toISODate(membre.retardDepuis));
    if (jour >= du && jour <= au) {
      elements.push({
        id: "restriction",
        type: "echeance",
        titre: "Accès restreint si la cotisation n’est pas réglée",
        jour,
        debut: null,
        fin: null,
        detail: `Au-delà de ${RETARD_BLOCAGE_JOURS} jours de retard`,
        href: "/membre/cotisations",
        urgent: true,
      });
    }
  }

  return trierElements([...elements, ...rappels]);
}

/** Les rappels personnels d'une personne sur une période. */
async function rappelsAgenda(
  userId: string,
  du: string,
  au: string,
): Promise<ElementAgenda[]> {
  const rows = await prisma.rappel.findMany({
    where: { userId, jour: { gte: jourBase(du), lte: jourBase(au) } },
    select: {
      id: true,
      titre: true,
      note: true,
      jour: true,
      heure: true,
      fait: true,
    },
  });
  return rows.map((r) => ({
    id: `rappel-${r.id}`,
    type: "rappel",
    titre: r.titre,
    jour: toISODate(r.jour),
    debut: r.heure,
    fin: null,
    detail: r.note,
    href: null,
    fait: r.fait,
    rappel: { id: r.id, note: r.note },
  }));
}

/**
 * L'agenda de l'équipe : tous les événements, les factures à encaisser de
 * tous les membres, les accès qui vont se restreindre, l'échéance annuelle
 * des cotisations, et les rappels de la personne connectée.
 */
export async function getAgendaEquipe(
  userId: string,
  du: string,
  au: string,
): Promise<ElementAgenda[]> {
  const aujourdhui = aujourdhuiISO();
  const periode = { gte: jourBase(du), lte: jourBase(au) };
  // Une échéance dans la période vient d'une date plus tôt d'autant.
  const avant = (jours: number) => ({
    gte: jourBase(ajouterJours(du, -jours)),
    lte: jourBase(ajouterJours(au, -jours)),
  });

  const [evenements, factures, retards, rappels] = await Promise.all([
    prisma.event.findMany({
      where: { date: periode },
      select: {
        id: true,
        titre: true,
        date: true,
        debut: true,
        fin: true,
        lieu: true,
        format: true,
        cap: true,
        _count: { select: { participants: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { statut: "envoyee", date: avant(DELAI_REGLEMENT_JOURS) },
      select: {
        id: true,
        numero: true,
        date: true,
        objet: true,
        montant: true,
        devise: true,
        destinataireNom: true,
        member: { select: { nom: true } },
      },
    }),
    prisma.member.findMany({
      where: {
        statut: "en_retard",
        retardDepuis: avant(RETARD_BLOCAGE_JOURS + 1),
      },
      select: { id: true, nom: true, retardDepuis: true },
    }),
    rappelsAgenda(userId, du, au),
  ]);

  const elements: ElementAgenda[] = [];

  for (const e of evenements) {
    elements.push({
      id: `evenement-${e.id}`,
      type: "evenement",
      titre: e.titre,
      jour: toISODate(e.date),
      debut: e.debut,
      fin: e.fin,
      lieu: e.lieu,
      detail: `${EVENT_FORMAT_LABEL[e.format]} · ${e._count.participants}/${e.cap} inscrits`,
      href: `/admin/evenements/${e.id}`,
    });
  }

  for (const f of factures) {
    const jour = echeanceFacture(toISODate(f.date));
    elements.push({
      id: `facture-${f.id}`,
      type: "echeance",
      titre: `Facture ${f.numero} · ${nomFacture(f)}`,
      jour,
      debut: null,
      fin: null,
      detail: `${f.objet} · ${fmtMontant(f.montant, f.devise)}`,
      href: `/admin/paiements/${f.id}`,
      urgent: jour < aujourdhui,
    });
  }

  for (const m of retards) {
    elements.push({
      id: `restriction-${m.id}`,
      type: "echeance",
      titre: `Accès restreint : ${m.nom}`,
      jour: dateRestriction(toISODate(m.retardDepuis!)),
      debut: null,
      fin: null,
      detail: `Cotisation non réglée après ${RETARD_BLOCAGE_JOURS} jours de retard`,
      href: `/admin/membres/${m.id}`,
      urgent: true,
    });
  }

  for (
    let annee = Number(du.slice(0, 4));
    annee <= Number(au.slice(0, 4));
    annee++
  ) {
    const jour = echeanceCotisation(annee);
    if (jour < du || jour > au) continue;
    elements.push({
      id: `cotisation-${annee}`,
      type: "echeance",
      titre: `Échéance des cotisations ${annee}`,
      jour,
      debut: null,
      fin: null,
      detail: "Renouvellement annuel des adhésions",
      href: "/admin/paiements",
    });
  }

  return trierElements([...elements, ...rappels]);
}

/* ============================ Messagerie ============================ */

/** Ce qu'on lit d'un utilisateur pour l'afficher dans la messagerie. */
const PERSONNE_FIL = {
  id: true,
  nom: true,
  fonction: true,
  email: true,
  tel: true,
  photo: true,
  role: true,
  member: { select: { id: true, nom: true, siteweb: true } },
} as const;

const EQUIPE = "Équipe CanCham";

/**
 * Fils de l'utilisateur, le plus récemment actif en tête.
 *
 * Seuls les fils auxquels il participe remontent. Ce qui s'affiche en tête
 * dépend de qui regarde : dans un échange individuel chacun voit l'autre, et
 * l'assistance apparaît au membre sous le nom de la chambre, à l'équipe sous
 * le nom du membre.
 */
export async function getThreads(user: {
  id: string;
  role: string;
}): Promise<MessageThread[]> {
  const rows = await prisma.messageThread.findMany({
    where: { participants: { some: { userId: user.id } } },
    include: {
      participants: {
        orderBy: { ajouteLe: "asc" },
        include: { user: { select: PERSONNE_FIL } },
      },
      messages: {
        orderBy: { sentAt: "asc" },
        include: { piecesJointes: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  const cote = user.role === "admin" ? "equipe" : "membre";

  const fils = rows.map((t): MessageThread => {
    const moi = t.participants.find((p) => p.userId === user.id);
    const autres = t.participants
      .filter((p) => p.userId !== user.id)
      .map((p) => p.user);

    const entrepriseDe = (u: (typeof autres)[number]) =>
      u.member?.nom ?? (u.role === "admin" ? EQUIPE : "");

    let entete: Pick<
      MessageThread,
      "nom" | "sousTitre" | "avatar" | "membre" | "contact"
    >;
    if (t.type === "groupe") {
      entete = {
        nom: t.nom ?? "Groupe",
        sousTitre: `${t.participants.length} participant${t.participants.length > 1 ? "s" : ""}`,
        avatar: t.avatar,
        membre: null,
        contact: null,
      };
    } else if (t.equipe && cote === "membre") {
      entete = {
        nom: t.nom ?? EQUIPE,
        sousTitre: "Support membres",
        avatar: LOGO_EQUIPE,
        membre: null,
        contact: null,
      };
    } else {
      // Échange individuel, ou assistance vue depuis l'équipe : la personne en face.
      const enFace = t.equipe
        ? (autres.find((u) => u.role !== "admin") ?? autres[0])
        : autres[0];
      entete = enFace
        ? {
            nom: enFace.nom,
            sousTitre: [
              t.equipe ? "Assistance" : null,
              entrepriseDe(enFace),
              t.equipe ? null : enFace.fonction,
            ]
              .filter(Boolean)
              .join(" · "),
            avatar: enFace.photo,
            membre: enFace.member,
            contact: {
              id: enFace.id,
              nom: enFace.nom,
              fonction: enFace.fonction,
              email: enFace.email,
              tel: enFace.tel,
              photo: enFace.photo,
            },
          }
        : {
            // L'autre personne a quitté la plateforme.
            nom: "Conversation",
            sousTitre: "",
            avatar: null,
            membre: null,
            contact: null,
          };
    }

    return {
      id: t.id,
      type: t.type,
      equipe: t.equipe,
      ...entete,
      init: initialesDe(entete.nom),
      participants: t.participants.map(({ user: u }) => ({
        id: u.id,
        nom: u.nom,
        fonction: u.fonction,
        entreprise: entrepriseDe(u),
        photo: u.photo,
      })),
      unread: t.messages.filter(
        (m) =>
          !m.supprimeLe &&
          m.userId !== user.id &&
          (!moi?.luLe || m.sentAt > moi.luLe),
      ).length,
      messages: t.messages.map((m) => ({
        id: m.id,
        de: m.auteur,
        moi: m.userId === user.id,
        texte: m.supprimeLe ? "" : m.texte,
        heure: heureRelative(m.sentAt),
        envoyeLe: m.sentAt.toISOString(),
        modifie: Boolean(m.modifieLe),
        supprime: Boolean(m.supprimeLe),
        transfere: m.transfere,
        pieces: m.piecesJointes.map((p) => ({
          id: p.id,
          nom: p.nom,
          type: p.type,
          taille: p.taille,
        })),
      })),
    };
  });

  // Un groupe tout juste créé, encore sans message, se classe à sa création.
  const activite = (t: MessageThread) =>
    t.messages.at(-1)?.envoyeLe ??
    rows.find((r) => r.id === t.id)!.createdAt.toISOString();
  return fils.sort((a, b) => activite(b).localeCompare(activite(a)));
}

/**
 * Messages non lus de l'utilisateur, tous fils confondus : ceux des autres,
 * arrivés depuis sa dernière ouverture de chaque fil.
 */
export async function getUnreadTotal(userId: string): Promise<number> {
  const [{ n }] = await prisma.$queryRaw<{ n: number }[]>`
    SELECT count(*)::int AS n
    FROM messages m
    JOIN participants_fils p
      ON p."threadId" = m."threadId" AND p."userId" = ${userId}
    WHERE m."supprimeLe" IS NULL
      AND m."userId" IS DISTINCT FROM ${userId}
      AND (p."luLe" IS NULL OR m."sentAt" > p."luLe")`;
  return n;
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

/* ============================ Recherche ============================ */

export interface ResultatRecherche {
  type:
    "membre" | "contact" | "evenement" | "actualite" | "ressource" | "facture";
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

  const admin = space === "admin";
  const [membres, evenements, actualites, ressources, contacts, factures] =
    await Promise.all([
      prisma.member.findMany({
        where: {
          ...(space === "admin"
            ? {}
            : { statut: { not: "candidature" as const } }),
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
      // L'équipe cherche aussi une personne — « qui est tojo@… ? » — et une
      // facture par son numéro. Rien de cela n'est ouvert aux membres.
      admin
        ? prisma.user.findMany({
            where: {
              role: "membre",
              memberId: { not: null },
              OR: [{ nom: like }, { email: like }, { tel: like }],
            },
            select: {
              id: true,
              nom: true,
              fonction: true,
              email: true,
              memberId: true,
              member: { select: { nom: true } },
            },
            take: 8,
            orderBy: { nom: "asc" },
          })
        : Promise.resolve([]),
      admin
        ? prisma.invoice.findMany({
            where: {
              OR: [
                { numero: like },
                { objet: like },
                { member: { nom: like } },
                { destinataireNom: like },
              ],
            },
            select: {
              id: true,
              numero: true,
              objet: true,
              statut: true,
              destinataireNom: true,
              member: { select: { nom: true } },
            },
            take: 8,
            orderBy: { date: "desc" },
          })
        : Promise.resolve([]),
    ]);

  return [
    ...membres.map((m) => ({
      type: "membre" as const,
      id: m.id,
      titre: m.nom,
      detail: `${m.secteur} · ${m.ville}`,
      // Le back-office ouvre la fiche de gestion, le membre la fiche d'annuaire.
      href:
        space === "admin"
          ? `/admin/membres/${m.id}`
          : `/membre/annuaire/${m.id}`,
    })),
    ...evenements.map((e) => ({
      type: "evenement" as const,
      id: e.id,
      titre: e.titre,
      detail: `${e.lieu} · ${toISODate(e.date)}`,
      href: `${base}/evenements/${e.id}`,
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
      detail: `${r.taille} · ${r.type === "payant" ? "payante" : "incluse"}`,
      href: admin ? `/admin/ressources/${r.id}/modifier` : `${base}/ressources`,
    })),
    ...contacts.map((c) => ({
      type: "contact" as const,
      id: c.id,
      titre: c.nom,
      detail: `${c.fonction} · ${c.member?.nom ?? "—"} · ${c.email}`,
      href: `/admin/membres/${c.memberId}`,
    })),
    ...factures.map((f) => ({
      type: "facture" as const,
      id: f.id,
      titre: `${f.numero} · ${nomFacture(f)}`,
      detail: `${f.objet} · ${f.statut === "payee" ? "payée" : "à régler"}`,
      href: `/admin/paiements/${f.id}`,
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
    prisma.event.count({ where: { date: { gte: jourBase() }, public: true } }),
  ]);

  return {
    membres,
    // « Secteur à préciser » n'est pas un secteur : c'est l'étape sautée
    // d'une inscription.
    secteurs: new Set(
      groupes.map((g) => g.secteur).filter((s) => s !== PROVISOIRE.secteur),
    ).size,
    villes: new Set(groupes.map((g) => g.ville)).size,
    evenementsAVenir: evenements,
  };
}

/**
 * Les prochains rendez-vous mis en avant sur la page publique — ceux qui y
 * sont diffusés : un événement réservé à la plateforme n'y paraît pas.
 */
export async function getProchainsEvenements(n = 3): Promise<CanchamEvent[]> {
  const rows = await prisma.event.findMany({
    where: { date: { gte: jourBase() }, public: true },
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
    public: e.public,
    prixPublic: e.prixPublic,
    desc: e.desc,
    photo: e.photo,
    debut: e.debut,
    fin: e.fin,
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
    invitationEnAttente: !u.motDePasse,
  }));
}

/**
 * Membres que l'on peut joindre par une nouvelle conversation.
 *
 * Ceux de l'annuaire, sans l'entreprise de l'utilisateur ni celles avec qui
 * un échange individuel existe déjà — la recherche de la messagerie les
 * propose sous « Nouvelle conversation ». Le référent est lu d'une requête
 * pour tous, et non membre par membre.
 */
export async function getMembresJoignables(
  user: { id: string; memberId: string | null },
  /** L'équipe écrit à tous les membres, candidats et adhésions en attente compris. */
  tous = false,
) {
  const [membres, fils] = await Promise.all([
    prisma.member.findMany({
      where: {
        ...(tous ? {} : { statut: { in: ["a_jour", "en_retard"] as const } }),
        ...(user.memberId ? { id: { not: user.memberId } } : {}),
      },
      select: { id: true, nom: true, secteur: true, logo: true, photo: true },
      orderBy: { nom: "asc" },
    }),
    // Entreprises avec lesquelles l'utilisateur a déjà un échange individuel.
    prisma.messageThread.findMany({
      where: {
        type: "individuel",
        equipe: false,
        participants: { some: { userId: user.id } },
      },
      select: {
        participants: {
          where: { userId: { not: user.id } },
          select: { user: { select: { memberId: true } } },
        },
      },
    }),
  ]);

  const dejaEnContact = new Set(
    fils.flatMap((f) => f.participants.map((p) => p.user.memberId)),
  );
  const disponibles = membres.filter((m) => !dejaEnContact.has(m.id));

  const referents = new Map(
    (
      await prisma.user.findMany({
        where: {
          memberId: { in: disponibles.map((m) => m.id) },
          contactPrincipal: true,
        },
        select: { memberId: true, nom: true },
      })
    ).map((u) => [u.memberId, u.nom]),
  );

  return disponibles.map((m) => ({
    id: m.id,
    nom: m.nom,
    secteur: m.secteur,
    vignette: m.photo ?? m.logo,
    referent: referents.get(m.id) ?? null,
  }));
}

/**
 * Personnes à qui l'on peut écrire : l'équipe CanCham, et les contacts des
 * entreprises membres dont l'adhésion est active. Sert à composer un groupe et
 * à transférer un message.
 */
export async function getPersonnesJoignables(
  userId: string,
): Promise<Personne[]> {
  const rows = await prisma.user.findMany({
    where: critereJoignable(userId),
    select: {
      id: true,
      nom: true,
      fonction: true,
      photo: true,
      role: true,
      member: { select: { nom: true } },
    },
    orderBy: { nom: "asc" },
  });
  return rows.map((u) => ({
    id: u.id,
    nom: u.nom,
    fonction: u.fonction,
    entreprise: u.member?.nom ?? (u.role === "admin" ? EQUIPE : ""),
    photo: u.photo,
  }));
}
