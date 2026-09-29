import "server-only";

import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { toISODate } from "@/lib/enums";
import type { Invoice } from "@/lib/types";

/**
 * Le numéro qui suit, parmi ceux déjà attribués pour l'année.
 *
 * On part du plus grand numéro plutôt que du nombre de factures : compter
 * redonnerait un numéro déjà pris dès qu'une facture manque à la suite —
 * importée, émise ailleurs, ou supprimée.
 *
 * Le plus grand *en nombre*, pas en ordre alphabétique : passé 9999,
 * « CC-2026-10000 » se classe avant « CC-2026-9999 », et l'on redonnait
 * sans fin un numéro déjà pris — l'inscription échouait sur le doublon. Un
 * numéro dont la fin n'est pas un nombre est ignoré, plutôt que de faire
 * repartir la suite de zéro.
 */
export function numeroSuivant(numeros: string[], prefixe: string): string {
  let plusGrand = 0;
  for (const numero of numeros) {
    const fin = numero.slice(prefixe.length);
    if (numero.startsWith(prefixe) && /^\d+$/.test(fin)) {
      plusGrand = Math.max(plusGrand, Number(fin));
    }
  }
  return `${prefixe}${String(plusGrand + 1).padStart(4, "0")}`;
}

/** Numéro de facture séquentiel par année, ex. CC-2026-0008. */
export async function numeroFacture(date: Date): Promise<string> {
  // Année UTC : une date de facture est un minuit UTC (voir `jourBase`).
  const prefixe = `CC-${date.getUTCFullYear()}-`;
  const deLAnnee = await prisma.invoice.findMany({
    where: { numero: { startsWith: prefixe } },
    select: { numero: true },
  });
  return numeroSuivant(
    deLAnnee.map((f) => f.numero),
    prefixe,
  );
}

/**
 * Le destinataire d'une facture, tel qu'elle l'imprime.
 *
 * Tant que le membre existe, on le lit sur sa fiche. À sa suppression, la
 * facture en garde une copie (`destinataire`) : une pièce comptable se
 * réimprime à l'identique, même quand l'entreprise a quitté la chambre.
 */
export interface DestinataireFige {
  nom: string;
  ville: string;
  pays: string | null;
  statutJuridique: string | null;
  type: "morale" | "physique";
  contact: { nom: string; email: string; tel: string | null } | null;
}

/** Ce qu'il faut lire d'un membre pour composer son `DestinataireFige`. */
export const SELECTION_DESTINATAIRE = {
  nom: true,
  ville: true,
  pays: true,
  statutJuridique: true,
  type: true,
  users: {
    where: { role: "membre" },
    orderBy: [{ contactPrincipal: "desc" }, { createdAt: "asc" }],
    take: 1,
    select: { nom: true, email: true, tel: true },
  },
} satisfies Prisma.MemberSelect;

export function destinataireDe(
  m: Prisma.MemberGetPayload<{ select: typeof SELECTION_DESTINATAIRE }>,
): DestinataireFige {
  return {
    nom: m.nom,
    ville: m.ville,
    pays: m.pays,
    statutJuridique: m.statutJuridique,
    type: m.type,
    contact: m.users[0] ?? null,
  };
}

/** Nom du membre facturé, qu'il existe encore ou non. */
export function nomFacture(f: {
  member: { nom: string } | null;
  destinataireNom: string | null;
}): string {
  return f.member?.nom ?? f.destinataireNom ?? "Membre supprimé";
}

export interface FactureDetaillee extends Invoice {
  membreDetail: {
    ville: string;
    pays: string | null;
    statutJuridique: string | null;
    type: "morale" | "physique";
  };
  contact: { nom: string; email: string; tel: string | null } | null;
  /** Enregistrement du règlement, lu dans le journal. */
  reglement: string | null;
}

/** Une facture, avec ce qu'il faut pour l'imprimer. */
export async function getFacture(id: string): Promise<FactureDetaillee | null> {
  const f = await prisma.invoice.findUnique({
    where: { id },
    include: { member: { select: SELECTION_DESTINATAIRE } },
  });
  if (!f) return null;

  const trace = await prisma.auditLog.findFirst({
    where: {
      entite: "Invoice",
      entiteId: f.numero,
      action: { in: ["paiement_enregistre", "facture_payee"] },
    },
    orderBy: { createdAt: "desc" },
    select: { detail: true },
  });

  const d: DestinataireFige = f.member
    ? destinataireDe(f.member)
    : ((f.destinataire as DestinataireFige | null) ?? {
        nom: nomFacture(f),
        ville: "",
        pays: null,
        statutJuridique: null,
        type: "morale",
        contact: null,
      });

  return {
    id: f.id,
    numero: f.numero,
    date: toISODate(f.date),
    objet: f.objet,
    montant: f.montant,
    devise: f.devise,
    statut: f.statut,
    membreId: f.memberId,
    membre: d.nom,
    membreDetail: {
      ville: d.ville,
      pays: d.pays,
      statutJuridique: d.statutJuridique,
      type: d.type,
    },
    contact: d.contact,
    reglement: trace?.detail ?? null,
  };
}
