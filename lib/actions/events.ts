"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { EVENT_FORMAT_DB } from "@/lib/enums";
import { redirectWithFlash } from "@/lib/flash";
import { numeroFacture } from "@/lib/factures";
import { getCurrentUser } from "@/lib/session";
import { enregistrerImage, ImageRefusee } from "@/lib/uploads";
import type { EventFormat } from "@/lib/types";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const revalideTout = () => revalidatePath("/", "layout");

/** Code d'accès présenté à l'entrée, ex. CC-E2-4718. */
function codeAcces(eventId: string): string {
  return `CC-${eventId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
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

/** La personne de l'équipe qui agit, nommée dans le journal. */
async function acteurEquipe(): Promise<string> {
  return (await getCurrentUser("admin")).nom;
}

const pageEvenement = (id: string, onglet?: string) =>
  `/admin/evenements/${id}${onglet && onglet !== "tous" ? `?onglet=${onglet}` : ""}`;

/**
 * Création ou modification d'un événement, programme compris.
 *
 * Le programme est réécrit en entier à chaque enregistrement : ses étapes
 * n'ont pas d'identité propre, seulement un ordre, et les retrouver une à
 * une pour les comparer n'apporterait rien.
 */
export async function saveEvent(formData: FormData) {
  const id = texte(formData, "eventId");
  const retour = id
    ? `/admin/evenements/${id}/modifier`
    : "/admin/evenements/nouveau";

  const titre = texte(formData, "titre");
  const jour = texte(formData, "date");
  const cap = Math.round(Number(formData.get("cap")));
  const payant = texte(formData, "type") === "payant";
  const prix = payant ? Math.round(Number(formData.get("prix"))) : 0;

  if (!titre) redirectWithFlash(retour, "Le titre est obligatoire.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) {
    redirectWithFlash(retour, "Indiquez la date de l’événement.");
  }
  if (!Number.isFinite(cap) || cap < 1) {
    redirectWithFlash(retour, "La capacité doit être d’au moins une place.");
  }
  if (payant && (!Number.isFinite(prix) || prix <= 0)) {
    redirectWithFlash(retour, "Indiquez le tarif d’un événement payant.");
  }

  let photo: string | null = null;
  try {
    photo = await enregistrerImage(formData.get("photo"), {
      prefixe: "evenement",
      largeur: 1600,
    });
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithFlash(retour, e.message);
    throw e;
  }

  const heures = formData.getAll("etapeHeure").map(String);
  const titres = formData.getAll("etapeTitre").map(String);
  const details = formData.getAll("etapeDetail").map(String);
  const programme = titres
    .map((t, i) => ({
      heure: (heures[i] ?? "").trim(),
      titre: t.trim(),
      detail: (details[i] ?? "").trim() || null,
    }))
    .filter((e) => e.titre)
    .map((e, ordre) => ({ ...e, ordre }));

  const data = {
    titre,
    date: new Date(`${jour}T00:00:00`),
    heure: texte(formData, "heure") || null,
    lieu: texte(formData, "lieu") || "Antananarivo",
    format:
      EVENT_FORMAT_DB[
        (texte(formData, "format") || "Présentiel") as EventFormat
      ] ?? "presentiel",
    cap,
    payant,
    prix,
    desc: texte(formData, "desc") || "Détails à venir.",
    pourQui: texte(formData, "pourQui") || null,
  };
  const retirerPhoto = texte(formData, "retirerPhoto") === "1";

  const e = await prisma.$transaction(async (tx) => {
    const ev = id
      ? await tx.event.update({
          where: { id },
          data: {
            ...data,
            ...(photo ? { photo } : retirerPhoto ? { photo: null } : {}),
          },
        })
      : await tx.event.create({ data: { ...data, photo } });
    await tx.eventAgenda.deleteMany({ where: { eventId: ev.id } });
    if (programme.length) {
      await tx.eventAgenda.createMany({
        data: programme.map((etape) => ({ ...etape, eventId: ev.id })),
      });
    }
    return ev;
  });

  await prisma.auditLog.create({
    data: {
      action: id ? "evenement_modifie" : "evenement_cree",
      entite: "Event",
      entiteId: e.id,
      acteur: await acteurEquipe(),
      detail: `« ${e.titre} » · ${e.date.toLocaleDateString("fr-FR")} · ${e.lieu}.`,
    },
  });

  revalideTout();
  redirectWithFlash(
    pageEvenement(e.id),
    id
      ? `« ${e.titre} » mis à jour`
      : `« ${e.titre} » créé et publié aux membres`,
  );
}

export async function deleteEvent(formData: FormData) {
  const id = texte(formData, "eventId");
  const e = await prisma.event.findUnique({
    where: { id },
    select: { titre: true, _count: { select: { participants: true } } },
  });
  if (!e) redirectWithFlash("/admin/evenements", "Événement introuvable.");

  await prisma.auditLog.create({
    data: {
      action: "evenement_supprime",
      entite: "Event",
      entiteId: id,
      acteur: await acteurEquipe(),
      detail: `Suppression de « ${e.titre} » et de ses ${e._count.participants} participant${e._count.participants > 1 ? "s" : ""}.`,
    },
  });
  await prisma.event.delete({ where: { id } });
  revalideTout();
  redirectWithFlash("/admin/evenements", `« ${e.titre} » supprimé`);
}

/** Pointage à l'accueil : bascule présent / absent. */
export async function toggleAttendance(formData: FormData) {
  const attendeeId = texte(formData, "attendeeId");
  const eventId = texte(formData, "eventId");
  const onglet = texte(formData, "onglet");
  const a = await prisma.attendee.findUnique({ where: { id: attendeeId } });
  if (!a || a.eventId !== eventId) {
    redirectWithFlash(
      pageEvenement(eventId, onglet),
      "Participant introuvable.",
    );
  }

  const statut = a.statut === "present" ? "absent" : "present";
  await prisma.attendee.update({ where: { id: attendeeId }, data: { statut } });
  revalideTout();
  redirectWithFlash(
    pageEvenement(eventId, onglet),
    `${a.nom} — ${statut === "present" ? "arrivée enregistrée" : "marqué absent"}`,
  );
}

/** Inscription manuelle à l'accueil, y compris pour une arrivée sans inscription. */
export async function addAttendee(formData: FormData) {
  const eventId = texte(formData, "eventId");
  const nom = texte(formData, "nom");
  if (!nom) {
    redirectWithFlash(
      pageEvenement(eventId),
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
    pageEvenement(eventId, direct ? "presents" : undefined),
    direct
      ? `${nom} enregistré comme présent (arrivée directe)`
      : `${nom} inscrit à l’événement`,
  );
}

/** Retrait d'une personne de la liste, inscrite par erreur ou désistée. */
export async function retirerParticipant(formData: FormData) {
  const attendeeId = texte(formData, "attendeeId");
  const eventId = texte(formData, "eventId");
  const onglet = texte(formData, "onglet");
  const a = await prisma.attendee.findUnique({ where: { id: attendeeId } });
  if (!a || a.eventId !== eventId) {
    redirectWithFlash(
      pageEvenement(eventId, onglet),
      "Participant introuvable.",
    );
  }
  await prisma.attendee.delete({ where: { id: attendeeId } });
  revalideTout();
  redirectWithFlash(
    pageEvenement(eventId, onglet),
    `${a.nom} retiré de la liste`,
  );
}
