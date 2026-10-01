import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { delivrerBillets, delivrerBilletsPublics } from "@/lib/billets";
import { prisma } from "@/lib/db";
import { nomFacture } from "@/lib/factures";
import { fmtMontant } from "@/lib/membership";
import { MODES } from "@/lib/modes-reglement";
import { interrogerStatut, type EtatPaiement } from "@/lib/vanillapay";

/**
 * Ce qu'on fait d'un paiement dont on apprend l'issue.
 *
 * Deux chemins mènent ici : la notification signée du prestataire, et
 * l'interrogation du statut quand elle ne nous est pas parvenue. Les deux
 * passent par la même porte, et cette porte est rejouable : une notification
 * reçue deux fois — cela arrive, ils réessaient — ne règle pas la facture
 * deux fois et ne remet pas le membre à jour une seconde fois.
 */

const estCotisation = (objet: string) => /^cotisation/i.test(objet);

export type Issue =
  | "reglee"
  | "deja_reglee"
  | "echouee"
  | "montant_different"
  | "inconnue"
  | "en_cours";

/**
 * Conclut une tentative à partir de ce que le prestataire annonce.
 *
 * Rien n'est conclu sur ce qu'on ne comprend pas : un état illisible laisse
 * la tentative ouverte plutôt que de régler une facture à tort.
 */
export async function conclurePaiement(
  etat: EtatPaiement,
  charge: unknown,
): Promise<Issue> {
  // Gardée telle qu'elle est arrivée : le jour où un membre conteste, c'est
  // cette trace-là qui dit ce que le prestataire a annoncé, et quand.
  const trace = charge as Prisma.InputJsonValue;

  const p = await prisma.paiement.findUnique({
    where: { reference: etat.reference },
    include: {
      invoice: {
        include: { member: { select: { id: true, nom: true, statut: true } } },
      },
    },
  });
  if (!p) return "inconnue";

  // Déjà encaissée : on le note et on s'arrête là.
  if (p.statut === "reussie") return "deja_reglee";

  if (etat.echoue) {
    await prisma.paiement.update({
      where: { id: p.id },
      data: { statut: "echouee", notification: trace },
    });
    return "echouee";
  }
  if (!etat.reussi) return "en_cours";

  // Le montant annoncé doit être celui qu'on a demandé. S'il diffère, on ne
  // règle rien : c'est soit une erreur de leur côté, soit une requête
  // trafiquée, et dans les deux cas cela se regarde à la main.
  if (etat.montant !== null && etat.montant !== p.montant) {
    await prisma.$transaction([
      prisma.paiement.update({
        where: { id: p.id },
        data: { statut: "echouee", notification: trace },
      }),
      prisma.auditLog.create({
        data: {
          action: "paiement_refuse",
          entite: "Invoice",
          entiteId: p.invoice?.numero ?? p.reference,
          acteur: "Vanilla Pay",
          detail: `Montant annoncé ${fmtMontant(etat.montant, p.devise)} au lieu de ${fmtMontant(p.montant, p.devise)} — règlement non enregistré.`,
        },
      }),
    ]);
    return "montant_different";
  }

  // Un règlement sans facture — une inscription, un achat de ressource — n'a
  // rien à passer à « payée » : il se contente d'être encaissé.
  const f = p.invoice;
  const membre = f?.member ?? null;
  const cotisation =
    membre !== null &&
    f !== null &&
    estCotisation(f.objet) &&
    membre.statut !== "a_jour";
  const montant = fmtMontant(p.montant, p.devise);
  const moyen = MODES[p.mode].titre;

  await prisma.$transaction([
    prisma.paiement.update({
      where: { id: p.id },
      data: {
        statut: "reussie",
        transaction: etat.transaction,
        notification: trace,
        regleLe: new Date(),
      },
    }),
    // La facture peut avoir été réglée entre-temps au back-office : on ne la
    // repasse à « payée » que si elle ne l'est pas déjà.
    ...(!f || f.statut === "payee"
      ? []
      : [
          prisma.invoice.update({
            where: { id: f.id },
            data: { statut: "payee" },
          }),
        ]),
    ...(cotisation
      ? [
          prisma.member.update({
            where: { id: membre.id },
            data: {
              statut: "a_jour",
              retardDepuis: null,
              paiementNote: `Payé en ligne · ${moyen.toLowerCase()} · ${montant}`,
            },
          }),
        ]
      : []),
    prisma.auditLog.create({
      data: {
        action: "paiement_en_ligne",
        entite: "Invoice",
        entiteId: f?.numero ?? p.reference,
        acteur: membre?.nom ?? (f ? nomFacture(f) : "Inscription publique"),
        detail: `${montant} réglés en ligne (${moyen.toLowerCase()})${etat.transaction ? ` · transaction ${etat.transaction}` : ""}.`,
      },
    }),
  ]);

  // Une participation réglée : l'inscription se confirme et les billets
  // partent, sans passer par l'équipe. Un membre a sa facture ; une
  // inscription publique n'a que son code, gardé avec le règlement.
  if (f) {
    await delivrerBillets(f.id, "Vanilla Pay");
  } else {
    const inscription = inscriptionPublique(p.detail);
    if (inscription) {
      await delivrerBilletsPublics(
        inscription.eventId,
        inscription.code,
        "Vanilla Pay",
      );
    }
  }

  return "reglee";
}

/** L'inscription publique qu'un règlement sans facture vient payer. */
export function inscriptionPublique(
  detail: unknown,
): { eventId: string; code: string } | null {
  if (!detail || typeof detail !== "object" || Array.isArray(detail))
    return null;
  const d = detail as Record<string, unknown>;
  return typeof d.inscription === "string" && typeof d.eventId === "string"
    ? { eventId: d.eventId, code: d.inscription }
    : null;
}

/**
 * Le règlement en cours d'une inscription publique : le moyen que le
 * visiteur a choisi, et la référence à rappeler. `null` tant qu'il n'a rien
 * choisi — ou quand l'équipe a écarté ce qu'il avait annoncé.
 */
export async function reglementPublicOuvert(code: string) {
  return prisma.paiement.findFirst({
    where: {
      invoiceId: null,
      statut: { in: ["en_cours", "annonce"] },
      detail: { path: ["inscription"], equals: code },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      mode: true,
      reference: true,
      statut: true,
      montant: true,
      devise: true,
    },
  });
}

/**
 * Au retour d'un paiement d'inscription publique : où en est-il ?
 *
 * La notification du prestataire a pu ne pas arriver encore — ou ne jamais
 * arriver, sur un poste de développement. On lui demande l'état, et on
 * conclut par la même porte que la notification. La référence ne suffit
 * pas : elle doit être celle d'un règlement de cette inscription-là, sinon
 * n'importe quelle référence devinée ferait interroger le prestataire.
 */
export async function suivrePaiementPublic(
  reference: string,
  code: string,
): Promise<"reussie" | "echouee" | "en_cours" | null> {
  const p = await prisma.paiement.findUnique({
    where: { reference },
    select: { statut: true, transaction: true, detail: true, invoiceId: true },
  });
  if (!p || p.invoiceId || inscriptionPublique(p.detail)?.code !== code) {
    return null;
  }
  if (p.statut === "en_cours" && p.transaction) {
    const etat = await interrogerStatut(p.transaction, "international");
    if (etat) {
      await conclurePaiement(etat, etat);
      const apres = await prisma.paiement.findUnique({
        where: { reference },
        select: { statut: true },
      });
      if (apres) return etatSimple(apres.statut);
    }
  }
  return etatSimple(p.statut);
}

const etatSimple = (statut: string): "reussie" | "echouee" | "en_cours" =>
  statut === "reussie"
    ? "reussie"
    : statut === "echouee"
      ? "echouee"
      : "en_cours";
