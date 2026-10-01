import "server-only";

import { after } from "next/server";
import { plageHoraire } from "@/lib/agenda";
import { envoyerCourriel, urlPublique } from "@/lib/courriel";
import { prisma } from "@/lib/db";
import { toISODate } from "@/lib/enums";
import { fmtDate } from "@/lib/format";
import {
  courrielBilletsEvenement,
  courrielInscriptionEnAttente,
} from "@/lib/modeles-courriels";
import { notifierEquipe, notifierMembre } from "@/lib/push";

/**
 * Les billets d'un événement : ce qu'on envoie, et quand.
 *
 * Partagé entre l'inscription (`lib/actions/events.ts`), qui envoie les
 * billets d'un événement gratuit sur-le-champ, et le règlement d'une
 * facture de participation (`delivrerBillets`), qui les fait partir dès que
 * l'argent est constaté — par le prestataire en ligne comme par l'équipe.
 */

/** Ce qu'un e-mail doit savoir d'un événement pour y conduire quelqu'un. */
export type EvenementCourriel = {
  id: string;
  titre: string;
  date: Date;
  debut: string | null;
  fin: string | null;
  lieu: string;
};

/** Date et horaire d'un événement, tels que les e-mails les annoncent. */
export function quandEvenement(e: EvenementCourriel): string {
  return [fmtDate(toISODate(e.date)), plageHoraire(e.debut, e.fin)]
    .filter(Boolean)
    .join(" · ");
}

/** Les lignes d'accueil d'une inscription : son code, et ses déclinaisons. */
export const lignesDe = (code: string) => ({
  OR: [{ code }, { code: { startsWith: `${code}-` } }],
});

/**
 * Les billets d'une inscription : un QR code par participant, envoyés à
 * l'adresse donnée au moment de s'inscrire.
 *
 * L'envoi a lieu après la réponse : une messagerie lente ne doit pas faire
 * attendre devant un formulaire, et l'inscription, elle, est déjà écrite.
 */
export function envoyerBillets(
  e: EvenementCourriel,
  participants: { nom: string; code: string }[],
  email: string,
  lien: string,
): void {
  after(async () =>
    envoyerCourriel(
      await courrielBilletsEvenement(email, {
        evenement: e.titre,
        quand: quandEvenement(e),
        lieu: e.lieu,
        participants,
        lien,
      }),
    ),
  );
}

/** Événement payant : l'inscription est prise, le billet attend le règlement. */
export function envoyerAttente(
  e: EvenementCourriel,
  participants: { nom: string }[],
  email: string,
  lien: string,
  aRegler: string,
): void {
  after(() =>
    envoyerCourriel(
      courrielInscriptionEnAttente(email, {
        evenement: e.titre,
        quand: quandEvenement(e),
        lieu: e.lieu,
        participants,
        lien,
        aRegler,
      }),
    ),
  );
}

/**
 * Une facture de participation réglée : l'inscription se confirme et les
 * billets partent, sans que l'équipe n'ait rien à valider.
 *
 * Rejouable sans risque : les lignes déjà confirmées ne le sont pas deux
 * fois, et une facture qui n'est pas une participation — une cotisation —
 * ne fait rien. Vrai si des billets sont partis.
 */
export async function delivrerBillets(
  factureId: string,
  acteur: string,
): Promise<boolean> {
  const f = await prisma.invoice.findUnique({
    where: { id: factureId },
    select: { numero: true, eventId: true, memberId: true, event: true },
  });
  if (!f?.eventId || !f.memberId || !f.event) return false;
  const { eventId, memberId, event } = f;

  const inscription = await prisma.registration.findUnique({
    where: { eventId_memberId: { eventId, memberId } },
    select: { code: true },
  });
  if (!inscription) return false;

  const lignes = await prisma.attendee.findMany({
    where: { eventId, statut: "a_valider", ...lignesDe(inscription.code) },
    orderBy: { createdAt: "asc" },
    select: { id: true, nom: true, code: true, email: true, entreprise: true },
  });
  if (!lignes.length) return false;
  const n = lignes.length;

  await prisma.$transaction([
    prisma.attendee.updateMany({
      where: { id: { in: lignes.map((l) => l.id) } },
      data: { statut: "confirme" },
    }),
    prisma.auditLog.create({
      data: {
        action: "inscription_validee",
        entite: "Event",
        entiteId: eventId,
        acteur,
        detail: `« ${event.titre} » · ${lignes[0].entreprise} · ${n} personne${n > 1 ? "s" : ""} · facture ${f.numero} réglée · billets envoyés.`,
      },
    }),
  ]);

  // Les lignes d'une inscription partagent l'adresse donnée à l'inscription.
  const email = lignes[0].email;
  const participants = lignes.flatMap((l) =>
    l.code ? [{ nom: l.nom, code: l.code }] : [],
  );
  const page = `/membre/evenements/${eventId}`;
  if (participants.length && email.includes("@")) {
    envoyerBillets(event, participants, email, await urlPublique(page));
  }
  after(() =>
    notifierMembre(memberId, {
      titre: `Vos billets : ${event.titre}`,
      corps: `Règlement reçu · ${n} participant${n > 1 ? "s" : ""} · billets envoyés à ${email}`,
      url: page,
    }),
  );
  return true;
}

/**
 * Une inscription publique réglée en ligne : elle se confirme et ses billets
 * partent, comme pour un membre. Il n'y a ni facture ni compte : c'est le
 * code de l'inscription qui relie le règlement à ses lignes d'accueil.
 *
 * Rejouable sans risque — des lignes déjà confirmées ne le sont pas deux
 * fois. Vrai si des billets sont partis.
 */
export async function delivrerBilletsPublics(
  eventId: string,
  code: string,
  acteur: string,
): Promise<boolean> {
  const [event, lignes] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.attendee.findMany({
      where: { eventId, statut: "a_valider", ...lignesDe(code) },
      orderBy: { createdAt: "asc" },
      select: { id: true, nom: true, code: true, email: true, entreprise: true },
    }),
  ]);
  if (!event || !lignes.length) return false;
  const n = lignes.length;

  await prisma.$transaction([
    prisma.attendee.updateMany({
      where: { id: { in: lignes.map((l) => l.id) } },
      data: { statut: "confirme" },
    }),
    prisma.auditLog.create({
      data: {
        action: "inscription_validee",
        entite: "Event",
        entiteId: eventId,
        acteur,
        detail: `« ${event.titre} » · ${lignes[0].entreprise} · ${n} personne${n > 1 ? "s" : ""} · inscription publique réglée en ligne · billets envoyés.`,
      },
    }),
  ]);

  const email = lignes[0].email;
  const participants = lignes.flatMap((l) =>
    l.code ? [{ nom: l.nom, code: l.code }] : [],
  );
  if (participants.length && email.includes("@")) {
    envoyerBillets(
      event,
      participants,
      email,
      await urlPublique(
        `/evenements/${eventId}/billet?${new URLSearchParams({ code })}`,
      ),
    );
  }
  // L'équipe n'a rien à valider, mais elle doit le savoir.
  after(() =>
    notifierEquipe({
      titre: `Inscription publique réglée : ${event.titre}`,
      corps: `${lignes[0].entreprise} · ${n} personne${n > 1 ? "s" : ""} · payé en ligne`,
      url: `/admin/evenements/${eventId}`,
    }),
  );
  return true;
}
