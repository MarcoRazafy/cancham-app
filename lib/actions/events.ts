"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { EVENT_FORMAT_DB } from "@/lib/enums";
import { redirectWithFlash } from "@/lib/flash";
import { getCurrentUser } from "@/lib/session";
import type { EventFormat } from "@/lib/types";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const revalideTout = () => revalidatePath("/", "layout");

/** Code d'accès présenté à l'entrée, ex. CC-E2-4718. */
function codeAcces(eventId: string): string {
  return `CC-${eventId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function numeroFacture(date: Date): Promise<string> {
  const annee = date.getFullYear();
  const n = await prisma.invoice.count({
    where: { numero: { startsWith: `CC-${annee}-` } },
  });
  return `CC-${annee}-${String(n + 1).padStart(4, "0")}`;
}

/* ============================ Côté membre ============================ */

/**
 * Inscription d'un membre à un événement.
 *
 * Trois écritures liées : l'inscription, la personne attendue à l'accueil, et
 * la facture si l'événement est payant. Elles partent ensemble ou pas du tout.
 */
export async function registerForEvent(formData: FormData) {
  const eventId = texte(formData, "eventId");
  const user = await getCurrentUser("membre");
  if (!user.memberId) {
    redirectWithFlash(
      `/membre/evenements/${eventId}`,
      "Aucun membre rattaché à ce compte.",
    );
  }

  const [event, membre] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { participants: true } } },
    }),
    prisma.member.findUnique({
      where: { id: user.memberId },
      select: { nom: true },
    }),
  ]);

  if (!event || !membre) {
    redirectWithFlash("/membre/evenements", "Événement introuvable.");
  }

  const deja = await prisma.registration.findUnique({
    where: { eventId_memberId: { eventId, memberId: user.memberId } },
  });
  if (deja) {
    redirectWithFlash(
      `/membre/evenements/${eventId}`,
      "Vous êtes déjà inscrit à cet événement.",
    );
  }

  if (event._count.participants >= event.cap) {
    redirectWithFlash(
      `/membre/evenements/${eventId}`,
      "Cet événement est complet.",
    );
  }

  const code = codeAcces(eventId);
  const nom = texte(formData, "nom") || user.nom;
  const email = texte(formData, "email") || user.email;

  // Le tableau doit être annoté : sinon son type est figé par ses premiers
  // éléments et la facture ne peut plus y entrer.
  const ecritures: Prisma.PrismaPromise<unknown>[] = [
    prisma.registration.create({
      data: { eventId, memberId: user.memberId, code },
    }),
    prisma.attendee.create({
      data: { eventId, nom, entreprise: membre.nom, email, statut: "confirme" },
    }),
  ];

  if (event.payant) {
    const date = new Date();
    ecritures.push(
      prisma.invoice.create({
        data: {
          numero: await numeroFacture(date),
          date,
          objet: `Participation — ${event.titre}`,
          montant: event.prix,
          statut: "envoyee",
          memberId: user.memberId,
        },
      }),
    );
  }

  await prisma.$transaction(ecritures);
  revalideTout();
  redirectWithFlash(
    `/membre/evenements/${eventId}`,
    `Inscription confirmée · code ${code}${event.payant ? " · facture générée" : ""}`,
  );
}

export async function cancelRegistration(formData: FormData) {
  const eventId = texte(formData, "eventId");
  const user = await getCurrentUser("membre");
  if (!user.memberId)
    redirectWithFlash("/membre/evenements", "Aucun membre rattaché.");

  const membre = await prisma.member.findUnique({
    where: { id: user.memberId },
    select: { nom: true },
  });

  await prisma.registration.deleteMany({
    where: { eventId, memberId: user.memberId },
  });
  // On retire aussi la personne de la liste d'accueil.
  await prisma.attendee.deleteMany({
    where: { eventId, entreprise: membre?.nom, statut: "confirme" },
  });

  revalideTout();
  redirectWithFlash(`/membre/evenements/${eventId}`, "Inscription annulée");
}

/* ============================ Côté admin ============================ */

export async function saveEvent(formData: FormData) {
  const id = texte(formData, "eventId");
  const payant = texte(formData, "type") === "payant";
  const data = {
    titre: texte(formData, "titre") || "Nouvel événement",
    date: new Date(`${texte(formData, "date") || "2026-12-01"}T00:00:00`),
    lieu: texte(formData, "lieu") || "Antananarivo",
    format:
      EVENT_FORMAT_DB[
        (texte(formData, "format") || "Présentiel") as EventFormat
      ],
    cap: Number(formData.get("cap")) || 50,
    payant,
    prix: payant ? Number(formData.get("prix")) || 0 : 0,
    desc: texte(formData, "desc") || "Détails à venir.",
  };

  const e = id
    ? await prisma.event.update({ where: { id }, data })
    : await prisma.event.create({ data });

  revalideTout();
  redirectWithFlash(
    "/admin/evenements",
    id
      ? `« ${e.titre} » mis à jour`
      : `« ${e.titre} » créé et publié aux membres`,
  );
}

export async function deleteEvent(formData: FormData) {
  const id = texte(formData, "eventId");
  const e = await prisma.event.findUnique({
    where: { id },
    select: { titre: true },
  });
  await prisma.auditLog.create({
    data: {
      action: "evenement_supprime",
      entite: "Event",
      entiteId: id,
      acteur: "Équipe CanCham",
      detail: `Suppression de « ${e?.titre} » et de ses inscriptions.`,
    },
  });
  await prisma.event.delete({ where: { id } });
  revalideTout();
  redirectWithFlash("/admin/evenements", `« ${e?.titre} » supprimé`);
}

/** Pointage à l'accueil : bascule présent / absent. */
export async function toggleAttendance(formData: FormData) {
  const attendeeId = texte(formData, "attendeeId");
  const eventId = texte(formData, "eventId");
  const a = await prisma.attendee.findUnique({ where: { id: attendeeId } });
  if (!a)
    redirectWithFlash(
      `/admin/evenements/${eventId}/inscrits`,
      "Participant introuvable.",
    );

  const statut = a.statut === "present" ? "absent" : "present";
  await prisma.attendee.update({ where: { id: attendeeId }, data: { statut } });
  revalideTout();
  redirectWithFlash(
    `/admin/evenements/${eventId}/inscrits`,
    `${a.nom} — ${statut === "present" ? "arrivée enregistrée" : "marqué absent"}`,
  );
}

/** Inscription manuelle à l'accueil, y compris pour une arrivée sans inscription. */
export async function addAttendee(formData: FormData) {
  const eventId = texte(formData, "eventId");
  const nom = texte(formData, "nom");
  if (!nom) {
    redirectWithFlash(
      `/admin/evenements/${eventId}/inscrits`,
      "Le nom de la personne est requis.",
    );
  }

  const direct = texte(formData, "direct") === "1";
  await prisma.attendee.create({
    data: {
      eventId,
      nom,
      entreprise: texte(formData, "entreprise") || "Participant individuel",
      email: texte(formData, "email") || "—",
      statut: direct ? "present" : "confirme",
    },
  });

  revalideTout();
  redirectWithFlash(
    `/admin/evenements/${eventId}/inscrits`,
    direct
      ? `${nom} enregistré comme présent (arrivée directe)`
      : `${nom} inscrit à l’événement`,
  );
}
