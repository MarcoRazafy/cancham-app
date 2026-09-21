"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { EVENT_FORMAT_DB } from "@/lib/enums";
import { estHeure, estJourISO } from "@/lib/agenda";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { jourBase } from "@/lib/format";
import { numeroFacture } from "@/lib/factures";
import { estTermine } from "@/lib/presences";
import { exigerEquipe } from "@/lib/autorisations";
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
    redirectWithErreur(
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
    redirectWithErreur("/membre/evenements", "Événement introuvable.");
  }

  const deja = await prisma.registration.findUnique({
    where: { eventId_memberId: { eventId, memberId: user.memberId } },
  });
  if (deja) {
    redirectWithErreur(
      `/membre/evenements/${eventId}`,
      "Vous êtes déjà inscrit à cet événement.",
    );
  }

  if (event._count.participants >= event.cap) {
    redirectWithErreur(
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
    // Même code sur la ligne d'accueil : c'est lui que le scanner lira.
    prisma.attendee.create({
      data: {
        eventId,
        nom,
        entreprise: membre.nom,
        email,
        statut: "confirme",
        code,
      },
    }),
  ];

  if (event.payant) {
    const date = jourBase();
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
    redirectWithErreur("/membre/evenements", "Aucun membre rattaché.");

  const membre = await prisma.member.findUnique({
    where: { id: user.memberId },
    select: { nom: true },
  });

  const inscription = await prisma.registration.findUnique({
    where: { eventId_memberId: { eventId, memberId: user.memberId } },
    select: { code: true },
  });
  await prisma.registration.deleteMany({
    where: { eventId, memberId: user.memberId },
  });
  // On retire aussi la personne de la liste d'accueil : la ligne qui porte
  // le code de l'inscription, ou, pour une inscription plus ancienne que ce
  // lien, celle de l'entreprise encore en attente.
  await prisma.attendee.deleteMany({
    where: {
      eventId,
      OR: [
        ...(inscription ? [{ code: inscription.code }] : []),
        { entreprise: membre?.nom, statut: "confirme", code: null },
      ],
    },
  });

  revalideTout();
  redirectWithFlash(`/membre/evenements/${eventId}`, "Inscription annulée");
}

/* ============================ Côté admin ============================ */

/** La personne de l'équipe qui agit, nommée dans le journal. */
async function acteurEquipe(): Promise<string> {
  return (await getCurrentUser("admin")).nom;
}

const pageEvenement = (id: string) => `/admin/evenements/${id}`;

/**
 * La liste d'accueil telle qu'on l'a quittée : onglet, recherche, taille et
 * numéro de page. Pointer une arrivée ne doit ni refermer la liste ni
 * renvoyer en première page. Seule une adresse de cet événement est
 * acceptée ; à défaut, la liste s'ouvre sur l'onglet demandé.
 */
function retourListe(fd: FormData, eventId: string, onglet?: string): string {
  const base = pageEvenement(eventId);
  const r = texte(fd, "retour");
  if (r === base || r.startsWith(`${base}?`)) return r;
  const q = new URLSearchParams({ vue: "inscrits" });
  if (onglet && onglet !== "tous") q.set("onglet", onglet);
  return `${base}?${q}`;
}

/**
 * Création ou modification d'un événement, programme compris.
 *
 * Le programme est réécrit en entier à chaque enregistrement : ses étapes
 * n'ont pas d'identité propre, seulement un ordre, et les retrouver une à
 * une pour les comparer n'apporterait rien.
 */
export async function saveEvent(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "eventId");
  const retour = id
    ? `/admin/evenements/${id}/modifier`
    : "/admin/evenements/nouveau";

  const titre = texte(formData, "titre");
  const jour = texte(formData, "date");
  const cap = Math.round(Number(formData.get("cap")));
  const payant = texte(formData, "type") === "payant";
  const prix = payant ? Math.round(Number(formData.get("prix"))) : 0;

  const debut = texte(formData, "debut") || null;
  const fin = texte(formData, "fin") || null;

  if (!titre) redirectWithErreur(retour, "Le titre est obligatoire.");
  if (!estJourISO(jour)) {
    redirectWithErreur(retour, "Indiquez la date de l’événement.");
  }
  if ((debut && !estHeure(debut)) || (fin && !estHeure(fin))) {
    redirectWithErreur(retour, "Les heures s’écrivent HH:MM.");
  }
  if (fin && !debut) {
    redirectWithErreur(retour, "Indiquez l’heure de début avant celle de fin.");
  }
  if (debut && fin && fin <= debut) {
    redirectWithErreur(retour, "L’heure de fin doit suivre celle du début.");
  }
  if (!Number.isFinite(cap) || cap < 1) {
    redirectWithErreur(retour, "La capacité doit être d’au moins une place.");
  }
  if (payant && (!Number.isFinite(prix) || prix <= 0)) {
    redirectWithErreur(retour, "Indiquez le tarif d’un événement payant.");
  }

  let photo: string | null = null;
  try {
    photo = await enregistrerImage(formData.get("photo"), {
      prefixe: "evenement",
      largeur: 1600,
    });
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithErreur(retour, e.message);
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
    date: jourBase(jour),
    debut,
    fin,
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
      detail: `« ${e.titre} » · ${e.date.toLocaleDateString("fr-FR", { timeZone: "UTC" })} · ${e.lieu}.`,
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
  await exigerEquipe();
  const id = texte(formData, "eventId");
  const e = await prisma.event.findUnique({
    where: { id },
    select: { titre: true, _count: { select: { participants: true } } },
  });
  if (!e) redirectWithErreur("/admin/evenements", "Événement introuvable.");

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
  await exigerEquipe();
  const attendeeId = texte(formData, "attendeeId");
  const eventId = texte(formData, "eventId");
  const retour = retourListe(formData, eventId);
  const a = await prisma.attendee.findUnique({ where: { id: attendeeId } });
  if (!a || a.eventId !== eventId) {
    redirectWithErreur(retour, "Participant introuvable.");
  }

  // « Présent » et « Absent » disent ce qu'ils font ; sans précision, le
  // pointage bascule, comme avant.
  const demande = texte(formData, "statut");
  const statut =
    demande === "present" || demande === "absent"
      ? demande
      : a.statut === "present"
        ? "absent"
        : "present";
  await prisma.attendee.update({ where: { id: attendeeId }, data: { statut } });
  revalideTout();
  redirectWithFlash(
    retour,
    `${a.nom} — ${statut === "present" ? "présent" : "absent"}`,
  );
}

/** Ce que le scanner affiche après la lecture d'un code. */
export type ResultatScan =
  | { etat: "present" | "deja"; code: string; nom: string; entreprise: string }
  | { etat: "erreur"; code: string; message: string };

/**
 * Pointage par QR code, depuis le scanner de la page de l'événement.
 *
 * Le QR code d'un membre porte son code d'accueil (CC-E1-4040) : la ligne
 * d'accueil qui le porte passe « présente ». Pas de redirection — le scanner
 * reste ouvert pour la personne suivante — et un résultat à afficher : qui
 * vient d'arriver, qui était déjà là, ou pourquoi le code est refusé.
 */
export async function pointerParCode(
  eventId: string,
  lu: string,
): Promise<ResultatScan> {
  await getCurrentUser("admin");

  // Le code seul, même lu au milieu d'un texte plus long.
  const code = /CC-[A-Z0-9]+-\d{4}/i.exec(lu)?.[0].toUpperCase() ?? lu.trim();
  if (!code) return { etat: "erreur", code, message: "Aucun code lu." };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { titre: true, date: true, fin: true },
  });
  if (!event) {
    return { etat: "erreur", code, message: "Événement introuvable." };
  }
  if (estTermine(event)) {
    return {
      etat: "erreur",
      code,
      message:
        "L’événement est terminé : les personnes non pointées ont été marquées absentes.",
    };
  }

  let ligne = await prisma.attendee.findUnique({ where: { code } });

  if (!ligne) {
    // Code d'une inscription dont la ligne d'accueil n'a pas encore été
    // rattachée — ou a été retirée : on la retrouve, ou on la recrée.
    const inscription = await prisma.registration.findUnique({
      where: { code },
      select: {
        eventId: true,
        member: {
          select: {
            id: true,
            nom: true,
            users: {
              orderBy: [{ contactPrincipal: "desc" }, { createdAt: "asc" }],
              take: 1,
              select: { nom: true, email: true },
            },
          },
        },
      },
    });
    if (!inscription) {
      return { etat: "erreur", code, message: `Code inconnu : ${code}.` };
    }
    if (inscription.eventId !== eventId) {
      const autre = await prisma.event.findUnique({
        where: { id: inscription.eventId },
        select: { titre: true },
      });
      return {
        etat: "erreur",
        code,
        message: `Ce code est celui d’un autre événement : « ${autre?.titre ?? "?"} ».`,
      };
    }
    const libre = await prisma.attendee.findFirst({
      where: { eventId, entreprise: inscription.member.nom, code: null },
      orderBy: { createdAt: "asc" },
    });
    const contact = inscription.member.users[0];
    ligne = libre
      ? await prisma.attendee.update({
          where: { id: libre.id },
          data: { code },
        })
      : await prisma.attendee.create({
          data: {
            eventId,
            nom: contact?.nom ?? inscription.member.nom,
            entreprise: inscription.member.nom,
            email: contact?.email ?? "—",
            statut: "confirme",
            code,
          },
        });
  }

  if (ligne.eventId !== eventId) {
    const autre = await prisma.event.findUnique({
      where: { id: ligne.eventId },
      select: { titre: true },
    });
    return {
      etat: "erreur",
      code,
      message: `Ce code est celui d’un autre événement : « ${autre?.titre ?? "?"} ».`,
    };
  }

  const qui = { code, nom: ligne.nom, entreprise: ligne.entreprise };
  if (ligne.statut === "present") return { etat: "deja", ...qui };

  await prisma.attendee.update({
    where: { id: ligne.id },
    data: { statut: "present" },
  });
  revalideTout();
  return { etat: "present", ...qui };
}

/** Inscription manuelle à l'accueil, y compris pour une arrivée sans inscription. */
export async function addAttendee(formData: FormData) {
  await exigerEquipe();
  const eventId = texte(formData, "eventId");
  const nom = texte(formData, "nom");
  if (!nom) {
    redirectWithErreur(
      retourListe(formData, eventId),
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
    retourListe(formData, eventId, direct ? "presents" : undefined),
    direct
      ? `${nom} enregistré comme présent (arrivée directe)`
      : `${nom} inscrit à l’événement`,
  );
}

/** Retrait d'une personne de la liste, inscrite par erreur ou désistée. */
export async function retirerParticipant(formData: FormData) {
  await exigerEquipe();
  const attendeeId = texte(formData, "attendeeId");
  const eventId = texte(formData, "eventId");
  const retour = retourListe(formData, eventId);
  const a = await prisma.attendee.findUnique({ where: { id: attendeeId } });
  if (!a || a.eventId !== eventId) {
    redirectWithErreur(retour, "Participant introuvable.");
  }
  await prisma.attendee.delete({ where: { id: attendeeId } });
  revalideTout();
  redirectWithFlash(retour, `${a.nom} retiré de la liste`);
}
