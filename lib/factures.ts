import "server-only";

import { prisma } from "@/lib/db";
import { toISODate } from "@/lib/enums";
import type { Invoice } from "@/lib/types";

/**
 * Numéro de facture séquentiel par année, ex. CC-2026-0008.
 *
 * On part du plus grand numéro de l'année plutôt que du nombre de factures :
 * compter redonnerait un numéro déjà pris dès qu'une facture manque à la
 * suite — importée, ou émise ailleurs.
 */
export async function numeroFacture(date: Date): Promise<string> {
  const annee = date.getFullYear();
  const prefixe = `CC-${annee}-`;
  const derniere = await prisma.invoice.findFirst({
    where: { numero: { startsWith: prefixe } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  const n = derniere ? Number(derniere.numero.slice(prefixe.length)) || 0 : 0;
  return `${prefixe}${String(n + 1).padStart(4, "0")}`;
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
    include: {
      member: {
        select: {
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
        },
      },
    },
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

  return {
    id: f.id,
    numero: f.numero,
    date: toISODate(f.date),
    objet: f.objet,
    montant: f.montant,
    devise: f.devise,
    statut: f.statut,
    membreId: f.memberId,
    membre: f.member.nom,
    membreDetail: {
      ville: f.member.ville,
      pays: f.member.pays,
      statutJuridique: f.member.statutJuridique,
      type: f.member.type,
    },
    contact: f.member.users[0] ?? null,
    reglement: trace?.detail ?? null,
  };
}
