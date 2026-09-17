import "server-only";

import { prisma } from "@/lib/db";
import { RESOURCE_CAT_LABEL } from "@/lib/enums";
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
              gte: new Date(`${annee}-01-01T00:00:00`),
              lt: new Date(`${annee + 1}-01-01T00:00:00`),
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
    commentaires: r._count.commentaires,
    demandes: parRessource.get(r.id) ?? 0,
  }));
}
