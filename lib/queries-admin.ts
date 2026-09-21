import "server-only";

import { prisma } from "@/lib/db";
import { RESOURCE_CAT_LABEL } from "@/lib/enums";
import { jourBase } from "@/lib/format";
import { codesDeFamille, type FamilleJournal } from "@/lib/journal";
import type { Devise, FormuleId } from "@/lib/membership";

/**
 * Lectures propres au back-office : journal des opérations, tableaux de bord
 * financiers, répartitions. Séparées de `queries.ts`, qui sert aussi l'espace
 * membre, pour qu'aucune page membre n'y touche par mégarde.
 */

export interface EntreeJournal {
  id: string;
  action: string;
  entite: string;
  entiteId: string;
  acteur: string;
  detail: string | null;
  /** Horodatage ISO. */
  date: string;
}

function versEntree(r: {
  id: string;
  action: string;
  entite: string;
  entiteId: string;
  acteur: string;
  detail: string | null;
  createdAt: Date;
}): EntreeJournal {
  return {
    id: r.id,
    action: r.action,
    entite: r.entite,
    entiteId: r.entiteId,
    acteur: r.acteur,
    detail: r.detail,
    date: r.createdAt.toISOString(),
  };
}

export async function getJournal({
  limite = 50,
  page = 1,
  famille,
  entite,
  entiteId,
  recherche,
}: {
  limite?: number;
  page?: number;
  famille?: FamilleJournal;
  entite?: string;
  entiteId?: string;
  recherche?: string;
} = {}): Promise<{ entrees: EntreeJournal[]; total: number }> {
  const where = {
    // Le chargement initial des données n'est pas une opération de l'équipe.
    action: famille ? { in: codesDeFamille(famille) } : { not: "seed" },
    ...(entite ? { entite } : {}),
    ...(entiteId ? { entiteId } : {}),
    ...(recherche
      ? {
          OR: [
            { detail: { contains: recherche, mode: "insensitive" as const } },
            { acteur: { contains: recherche, mode: "insensitive" as const } },
            { entiteId: { contains: recherche, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limite,
      skip: (page - 1) * limite,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    total,
    entrees: rows.map(versEntree),
  };
}

/** Historique d'un membre : ses entrées, et celles de ses factures. */
export async function getHistoriqueMembre(
  memberId: string,
): Promise<EntreeJournal[]> {
  const numeros = (
    await prisma.invoice.findMany({
      where: { memberId },
      select: { numero: true },
    })
  ).map((f) => f.numero);

  const rows = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entite: "Member", entiteId: memberId },
        { entite: "Invoice", entiteId: { in: numeros } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return rows.map(versEntree);
}

export type Montants = Record<Devise, number>;

/**
 * Encaissé et restant dû sur une année — ou depuis toujours —, par devise.
 *
 * Deux devises, deux totaux : additionner Ariary et dollars n'aurait pas de
 * sens.
 */
export async function getFinancesAnnee(annee: number | null): Promise<{
  encaisse: Montants;
  aEncaisser: Montants;
  factures: number;
  enAttente: number;
}> {
  const rows = await prisma.invoice.groupBy({
    by: ["devise", "statut"],
    where:
      annee === null
        ? undefined
        : {
            date: {
              gte: jourBase(`${annee}-01-01`),
              lt: jourBase(`${annee + 1}-01-01`),
            },
          },
    _sum: { montant: true },
    _count: { _all: true },
  });

  const somme = (statut: "payee" | "envoyee", devise: Devise) =>
    rows.find((r) => r.statut === statut && r.devise === devise)?._sum
      .montant ?? 0;
  const compte = (statut?: "payee" | "envoyee") =>
    rows
      .filter((r) => !statut || r.statut === statut)
      .reduce((n, r) => n + r._count._all, 0);

  return {
    encaisse: { MGA: somme("payee", "MGA"), CAD: somme("payee", "CAD") },
    aEncaisser: { MGA: somme("envoyee", "MGA"), CAD: somme("envoyee", "CAD") },
    factures: compte(),
    enAttente: compte("envoyee"),
  };
}

/** Années pour lesquelles au moins une facture existe, la plus récente d'abord. */
export async function getAnneesFactures(): Promise<number[]> {
  const rows = await prisma.$queryRaw<{ annee: number }[]>`
    SELECT DISTINCT EXTRACT(YEAR FROM date)::int AS annee
    FROM invoices ORDER BY annee DESC`;
  return rows.map((r) => r.annee);
}

/** Adhérents par formule, candidatures exclues. */
export async function getRepartitionFormules(): Promise<
  { formule: FormuleId; n: number }[]
> {
  const rows = await prisma.member.groupBy({
    by: ["formule"],
    where: { statut: { not: "candidature" } },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ formule: r.formule as FormuleId, n: r._count._all }))
    .sort((a, b) => b.n - a.n);
}

/** Demandes d'achat de ressources payantes non encore traitées par écrit. */
export async function getDemandesAchat(limite = 5): Promise<EntreeJournal[]> {
  const rows = await prisma.auditLog.findMany({
    where: { action: "ressource_achetee" },
    orderBy: { createdAt: "desc" },
    take: limite,
  });
  return rows.map(versEntree);
}

export interface Participant {
  id: string;
  nom: string;
  entreprise: string;
  email: string;
  statut: "confirme" | "present" | "absent";
}

/** Liste d'accueil d'un événement, par ordre alphabétique. */
export async function getParticipants(eventId: string): Promise<Participant[]> {
  return prisma.attendee.findMany({
    where: { eventId },
    orderBy: { nom: "asc" },
    select: {
      id: true,
      nom: true,
      entreprise: true,
      email: true,
      statut: true,
    },
  });
}

export interface RessourceAdmin {
  id: string;
  titre: string;
  cat: string;
  fmt: "pdf" | "docx" | "video";
  taille: string;
  date: string;
  type: "gratuit" | "payant";
  prix: number;
  /** Fichier prêt pour la lecture. */
  pret: boolean;
  pages: number | null;
  cover: string | null;
  commentaires: number;
  demandes: number;
}

/** Bibliothèque vue par l'équipe : état des fichiers et demandes d'achat. */
export async function getRessourcesAdmin(): Promise<RessourceAdmin[]> {
  const [rows, demandes] = await Promise.all([
    prisma.resource.findMany({
      include: { _count: { select: { commentaires: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.auditLog.groupBy({
      by: ["entiteId"],
      where: { action: "ressource_achetee" },
      _count: { _all: true },
    }),
  ]);
  const parRessource = new Map(
    demandes.map((d) => [d.entiteId, d._count._all]),
  );
  return rows.map((r) => ({
    id: r.id,
    titre: r.titre,
    cat: RESOURCE_CAT_LABEL[r.cat],
    fmt: r.fmt,
    taille: r.taille,
    date: r.date.toISOString().slice(0, 10),
    type: r.type,
    prix: r.prix,
    pret: Boolean(r.fichier) && (r.fmt === "video" || Boolean(r.pages)),
    pages: r.pages,
    cover: r.cover,
    commentaires: r._count.commentaires,
    demandes: parRessource.get(r.id) ?? 0,
  }));
}

/* ============================ Comptes et accès ============================ */

export interface CompteEquipe {
  id: string;
  nom: string;
  fonction: string;
  email: string;
  tel: string | null;
  photo: string | null;
  /** Date de création du compte, ISO court. */
  depuis: string;
  /** Compte jamais utilisé : le mot de passe n'a pas encore été défini. */
  sansMotDePasse: boolean;
}

/** L'équipe CanCham : les comptes qui ouvrent le back-office. */
export async function getAdministrateurs(): Promise<CompteEquipe[]> {
  const rows = await prisma.user.findMany({
    where: { role: "admin" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nom: true,
      fonction: true,
      email: true,
      tel: true,
      photo: true,
      createdAt: true,
      motDePasse: true,
    },
  });
  return rows.map((u) => ({
    id: u.id,
    nom: u.nom,
    fonction: u.fonction,
    email: u.email,
    tel: u.tel,
    photo: u.photo,
    depuis: u.createdAt.toISOString().slice(0, 10),
    sansMotDePasse: !u.motDePasse,
  }));
}

export interface CompteMembre extends CompteEquipe {
  /** L'entreprise à laquelle le compte est rattaché. */
  membre: {
    id: string;
    nom: string;
    statut: "candidature" | "en_attente" | "a_jour" | "en_retard";
    motivation: string | null;
    /** Fiche encore vide de tout historique : sa suppression n'emporte rien. */
    sansHistorique: boolean;
  } | null;
}

const compteMembreSelect = {
  id: true,
  nom: true,
  fonction: true,
  email: true,
  tel: true,
  photo: true,
  createdAt: true,
  motDePasse: true,
  member: {
    select: {
      id: true,
      nom: true,
      statut: true,
      motivation: true,
      _count: { select: { factures: true, inscriptions: true, produits: true } },
    },
  },
} as const;

type LigneCompte = {
  id: string;
  nom: string;
  fonction: string;
  email: string;
  tel: string | null;
  photo: string | null;
  createdAt: Date;
  motDePasse: string | null;
  member: {
    id: string;
    nom: string;
    statut: "candidature" | "en_attente" | "a_jour" | "en_retard";
    motivation: string | null;
    _count: { factures: number; inscriptions: number; produits: number };
  } | null;
};

function versCompteMembre(u: LigneCompte): CompteMembre {
  return {
    id: u.id,
    nom: u.nom,
    fonction: u.fonction,
    email: u.email,
    tel: u.tel,
    photo: u.photo,
    depuis: u.createdAt.toISOString().slice(0, 10),
    sansMotDePasse: !u.motDePasse,
    membre: u.member
      ? {
          id: u.member.id,
          nom: u.member.nom,
          statut: u.member.statut,
          motivation: u.member.motivation,
          sansHistorique:
            u.member._count.factures === 0 &&
            u.member._count.inscriptions === 0 &&
            u.member._count.produits === 0,
        }
      : null,
  };
}

/**
 * Les inscriptions à examiner : les comptes créés depuis l'espace public dont
 * l'adhésion n'est pas encore tranchée. C'est là que l'équipe reconnaît un
 * collaborateur et le promeut, au lieu de lui ouvrir une candidature.
 */
export async function getInscriptionsRecentes(
  limite = 12,
): Promise<CompteMembre[]> {
  const rows = await prisma.user.findMany({
    where: { role: "membre", member: { statut: "candidature" } },
    orderBy: { createdAt: "desc" },
    take: limite,
    select: compteMembreSelect,
  });
  return rows.map(versCompteMembre);
}

/** Recherche d'un compte membre par nom, adresse ou entreprise. */
export async function chercherComptes(
  recherche: string,
  limite = 20,
): Promise<CompteMembre[]> {
  const q = recherche.trim();
  if (!q) return [];
  const rows = await prisma.user.findMany({
    where: {
      role: { in: ["membre", "visiteur"] },
      OR: [
        { nom: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { member: { nom: { contains: q, mode: "insensitive" } } },
      ],
    },
    orderBy: { nom: "asc" },
    take: limite,
    select: compteMembreSelect,
  });
  return rows.map(versCompteMembre);
}
