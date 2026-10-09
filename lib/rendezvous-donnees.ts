import "server-only";

import { prisma } from "@/lib/db";
import { toISODate } from "@/lib/enums";
import { aujourdhuiISO } from "@/lib/format";
import { maintenant } from "@/lib/presences";
import {
  creneauxLibres,
  joursOuverts,
  type Occupe,
  type Plage,
} from "@/lib/rendezvous";

export interface TypeRendezvous {
  id: string;
  titre: string;
  detail: string | null;
  duree: number;
  actif: boolean;
  plages: (Plage & { id: string })[];
}

export interface RendezvousPris {
  id: string;
  jour: string;
  debut: string;
  fin: string;
  motif: string | null;
  type: { id: string; titre: string; duree: number };
  personne: { nom: string; email: string; tel: string | null };
  entreprise: string | null;
  annule: boolean;
  annulePar: string | null;
}

const CHAMPS = {
  id: true,
  jour: true,
  debut: true,
  fin: true,
  motif: true,
  annuleLe: true,
  annulePar: true,
  type: { select: { id: true, titre: true, duree: true } },
  user: { select: { nom: true, email: true, tel: true } },
  member: { select: { nom: true } },
} as const;

function versRendezvous(r: {
  id: string;
  jour: Date;
  debut: string;
  fin: string;
  motif: string | null;
  annuleLe: Date | null;
  annulePar: string | null;
  type: { id: string; titre: string; duree: number };
  user: { nom: string; email: string; tel: string | null };
  member: { nom: string } | null;
}): RendezvousPris {
  return {
    id: r.id,
    jour: toISODate(r.jour),
    debut: r.debut,
    fin: r.fin,
    motif: r.motif,
    type: r.type,
    personne: r.user,
    entreprise: r.member?.nom ?? null,
    annule: r.annuleLe !== null,
    annulePar: r.annulePar,
  };
}

export async function getTypesRendezvous(
  tous = false,
): Promise<TypeRendezvous[]> {
  return prisma.typeRendezvous.findMany({
    where: tous ? undefined : { actif: true },
    orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      titre: true,
      detail: true,
      duree: true,
      actif: true,
      plages: {
        orderBy: [{ jour: "asc" }, { debut: "asc" }],
        select: { id: true, jour: true, debut: true, fin: true },
      },
    },
  });
}

export async function getPlages(
  typeId: string,
): Promise<(Plage & { id: string })[]> {
  return prisma.disponibilite.findMany({
    where: { typeId },
    orderBy: [{ jour: "asc" }, { debut: "asc" }],
    select: { id: true, jour: true, debut: true, fin: true },
  });
}

async function occupes(du: string, au: string): Promise<Map<string, Occupe[]>> {
  const pris = await prisma.rendezvous.findMany({
    where: {
      annuleLe: null,
      jour: {
        gte: new Date(`${du}T00:00:00Z`),
        lte: new Date(`${au}T00:00:00Z`),
      },
    },
    select: { jour: true, debut: true, fin: true },
  });
  const par = new Map<string, Occupe[]>();
  for (const p of pris) {
    const jour = toISODate(p.jour);
    par.set(jour, [...(par.get(jour) ?? []), { debut: p.debut, fin: p.fin }]);
  }
  return par;
}

export interface JourProposable {
  jour: string;
  creneaux: string[];
}

export async function getCreneaux(type: {
  id: string;
  duree: number;
  plages?: Plage[];
}): Promise<JourProposable[]> {
  const plages = type.plages ?? (await getPlages(type.id));
  const duree = type.duree;
  const depuis = aujourdhuiISO();
  const jours = joursOuverts(depuis, plages);
  if (!jours.length) return [];

  const pris = await occupes(jours[0], jours[jours.length - 1]);
  const instant = maintenant();

  return jours
    .map((jour) => ({
      jour,
      creneaux: creneauxLibres({
        jour,
        plages,
        duree,
        occupes: pris.get(jour) ?? [],
        maintenant: instant,
      }),
    }))
    .filter((j) => j.creneaux.length > 0);
}

export async function getMesRendezvous(
  userId: string,
): Promise<RendezvousPris[]> {
  const lignes = await prisma.rendezvous.findMany({
    where: {
      userId,
      annuleLe: null,
      jour: { gte: new Date(`${aujourdhuiISO()}T00:00:00Z`) },
    },
    orderBy: [{ jour: "asc" }, { debut: "asc" }],
    select: CHAMPS,
  });
  return lignes.map(versRendezvous);
}

export async function getRendezvousEquipe(): Promise<RendezvousPris[]> {
  const lignes = await prisma.rendezvous.findMany({
    where: {
      annuleLe: null,
      jour: { gte: new Date(`${aujourdhuiISO()}T00:00:00Z`) },
    },
    orderBy: [{ jour: "asc" }, { debut: "asc" }],
    select: CHAMPS,
  });
  return lignes.map(versRendezvous);
}

export async function getRendezvousAgenda(
  du: string,
  au: string,
  userId?: string,
): Promise<RendezvousPris[]> {
  const lignes = await prisma.rendezvous.findMany({
    where: {
      annuleLe: null,
      ...(userId ? { userId } : {}),
      jour: {
        gte: new Date(`${du}T00:00:00Z`),
        lte: new Date(`${au}T00:00:00Z`),
      },
    },
    orderBy: [{ jour: "asc" }, { debut: "asc" }],
    select: CHAMPS,
  });
  return lignes.map(versRendezvous);
}
