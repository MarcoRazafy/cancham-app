"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { EVENT_FORMAT_DB, toISODate } from "@/lib/enums";
import { estHeure, estJourISO } from "@/lib/agenda";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { fmtDate, fmtMoney, jourBase } from "@/lib/format";
import { envoyerCourriel, urlPublique } from "@/lib/courriel";
import { minutes, origineAppelante, tentative } from "@/lib/limite";
import { courrielInscriptionEvenement } from "@/lib/modeles-courriels";
import { plageHoraire } from "@/lib/agenda";
import { numeroFacture } from "@/lib/factures";
import {
  codeInscription,
  codeRepresentant,
  extraireCode,
} from "@/lib/codes-accueil";
import { estTermine } from "@/lib/presences";
import { telephoneValide } from "@/lib/accueil";
import { exigerEquipe } from "@/lib/autorisations";
import { getCurrentUser } from "@/lib/session";
import { enregistrerImage, ImageRefusee } from "@/lib/uploads";
import type { EventFormat } from "@/lib/types";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const revalideTout = () => revalidatePath("/", "layout");

/** Lettres et chiffres sans ambiguïté à la lecture : ni O/0, ni I/1. */
const ALPHABET_CODE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Code d'accès d'une inscription, présenté à l'entrée : « CC-VOPA-K7Q2PX ».
 *
 * La fin de l'identifiant de l'événement, puis six signes tirés au sort —
 * quatre chiffres ne suffisaient pas : au-delà d'une centaine d'inscrits,
 * deux inscriptions tiraient souvent le même, et la seconde échouait. Un
 * code déjà pris est retiré.
 */
async function codeAcces(eventId: string): Promise<string> {
  for (;;) {
    const tirage = Array.from(
      { length: 6 },
      () => ALPHABET_CODE[randomInt(ALPHABET_CODE.length)],
    ).join("");
    const code = `CC-${eventId.slice(-4).toUpperCase()}-${tirage}`;
    // Libre chez les membres comme parmi les inscriptions publiques, qui
    // n'ont que leurs lignes d'accueil.
    const [inscription, ligne] = await Promise.all([
      prisma.registration.findUnique({ where: { code }, select: { id: true } }),
      prisma.attendee.findFirst({
        where: lignesDe(code),
        select: { id: true },
      }),
    ]);
    if (!inscription && !ligne) return code;
  }
}

/** Les lignes d'accueil d'une inscription : son code, et ses déclinaisons. */
const lignesDe = (code: string) => ({
  OR: [{ code }, { code: { startsWith: `${code}-` } }],
});

/** Représentants inscrits par un membre, au plus. */
const REPRESENTANTS_MAX = 10;

const ADRESSE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Téléphone et e-mail d'une inscription, vérifiés ; sinon retour au formulaire. */
function coordonneesSaisies(
  formData: FormData,
  retour: string,
): { email: string; telephone: string } {
  const email = texte(formData, "email").toLowerCase().slice(0, 120);
  const telephone = texte(formData, "telephone").replace(/\s+/g, " ");
  if (!ADRESSE.test(email)) {
    redirectWithErreur(retour, "Indiquez une adresse e-mail valide.");
  }
  if (!telephoneValide(telephone)) {
    redirectWithErreur(
      retour,
      telephone
        ? `« ${telephone} » n’est pas un numéro de téléphone valide.`
        : "Indiquez un numéro de téléphone.",
    );
  }
  return { email, telephone };
}

/* ============================ Côté membre ============================ */

/**
 * Inscription d'un membre à un événement, avec un ou plusieurs
 * représentants choisis parmi ses contacts.
 *
 * Une inscription pour l'entreprise, une ligne d'accueil — et un QR code —
 * par représentant, et la facture si l'événement est payant. Tout part
 * ensemble ou rien ne part.
 */
export async function registerForEvent(formData: FormData) {
  const eventId = texte(formData, "eventId");
  const fiche = `/membre/evenements/${eventId}`;
  const user = await getCurrentUser("membre");
  if (!user.memberId) {
    redirectWithErreur(fiche, "Aucun membre rattaché à ce compte.");
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
  if (deja)
    redirectWithErreur(fiche, "Vous êtes déjà inscrit à cet événement.");

  const { email, telephone } = coordonneesSaisies(formData, fiche);

  // Les représentants viennent des contacts de l'entreprise, et d'elle
  // seule : un identifiant d'ailleurs, glissé dans le formulaire, est ignoré.
  const choisis = [...new Set(formData.getAll("representant").map(String))];
  const representants = await prisma.user.findMany({
    where: { id: { in: choisis }, memberId: user.memberId },
    orderBy: [{ contactPrincipal: "desc" }, { createdAt: "asc" }],
    select: { nom: true, email: true },
  });
  if (!representants.length) {
    redirectWithErreur(fiche, "Choisissez au moins un représentant.");
  }
  if (representants.length > REPRESENTANTS_MAX) {
    redirectWithErreur(
      fiche,
      `${REPRESENTANTS_MAX} représentants au plus par entreprise.`,
    );
  }

  const restantes = event.cap - event._count.participants;
  if (representants.length > restantes) {
    redirectWithErreur(
      fiche,
      restantes > 0
        ? `Il ne reste que ${restantes} place${restantes > 1 ? "s" : ""} : choisissez moins de représentants.`
        : "Cet événement est complet.",
    );
  }

  const code = await codeAcces(eventId);
  const n = representants.length;

  // Le tableau doit être annoté : sinon son type est figé par ses premiers
  // éléments et la facture ne peut plus y entrer.
  const ecritures: Prisma.PrismaPromise<unknown>[] = [
    prisma.registration.create({
      data: { eventId, memberId: user.memberId, code },
    }),
    // Une ligne d'accueil par représentant, chacune avec son code : c'est
    // lui que le scanner lira.
    prisma.attendee.createMany({
      data: representants.map((r, i) => ({
        eventId,
        nom: r.nom,
        entreprise: membre.nom,
        // Les coordonnées données à l'inscription : celles où la joindre.
        email,
        telephone,
        statut: "confirme" as const,
        code: codeRepresentant(code, i),
      })),
    }),
  ];

  if (event.payant) {
    const date = jourBase();
    ecritures.push(
      prisma.invoice.create({
        data: {
          numero: await numeroFacture(date),
          date,
          objet: `Participation — ${event.titre}${n > 1 ? ` (${n} personnes)` : ""}`,
          montant: event.prix * n,
          statut: "envoyee",
          memberId: user.memberId,
        },
      }),
    );
  }

  await prisma.$transaction(ecritures);
  revalideTout();
  redirectWithFlash(
    fiche,
    `Inscription confirmée · ${n} représentant${n > 1 ? "s" : ""}${event.payant ? " · facture générée" : ""}`,
  );
}

/* ============================ Côté public ============================ */

/** Inscriptions publiques depuis une même origine, en une heure. */
const INSCRIPTIONS_PUBLIQUES_PAR_HEURE = 10;

/**
 * Inscription à un événement depuis la vitrine, sans compte.
 *
 * L'entreprise et les représentants se saisissent à la main, avec les
 * coordonnées où les joindre. Chaque représentant reçoit sa ligne d'accueil
 * et son code — le scanner les pointe comme ceux des membres —, et un e-mail
 * de confirmation mène à la page des billets. Sans membre, pas de facture :
 * un événement payant se règle auprès de l'équipe, que le journal prévient.
 */
export async function inscriptionPublique(formData: FormData) {
  const eventId = texte(formData, "eventId");
  const fiche = `/public/evenements/${eventId}`;

  // Une même origine n'inscrit pas des foules à la chaîne.
  const attente = tentative(
    `inscription-publique:${await origineAppelante()}`,
    INSCRIPTIONS_PUBLIQUES_PAR_HEURE,
    60 * 60 * 1000,
  );
  if (attente) {
    redirectWithErreur(
      fiche,
      `Trop d’inscriptions depuis cet appareil. Réessayez dans ${minutes(attente)} minute${minutes(attente) > 1 ? "s" : ""}.`,
    );
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { participants: true } } },
  });
  if (!event) redirectWithErreur("/public", "Événement introuvable.");
  if (estTermine(event)) {
    redirectWithErreur(fiche, "Cet événement est terminé.");
  }

  const entreprise = texte(formData, "entreprise")
    .replace(/\s+/g, " ")
    .slice(0, 120);
  const noms = [
    ...new Set(
      formData
        .getAll("representant")
        .map((v) => String(v).replace(/\s+/g, " ").trim().slice(0, 80))
        .filter(Boolean),
    ),
  ];
  if (!entreprise) {
    redirectWithErreur(
      fiche,
      "Indiquez le nom de l’entreprise (ou N/A si vous venez à titre personnel).",
    );
  }
  if (!noms.length) {
    redirectWithErreur(fiche, "Indiquez le nom d’au moins un représentant.");
  }
  if (noms.length > REPRESENTANTS_MAX) {
    redirectWithErreur(
      fiche,
      `${REPRESENTANTS_MAX} représentants au plus par inscription.`,
    );
  }
  const { email, telephone } = coordonneesSaisies(formData, fiche);

  const restantes = event.cap - event._count.participants;
  if (noms.length > restantes) {
    redirectWithErreur(
      fiche,
      restantes > 0
        ? `Il ne reste que ${restantes} place${restantes > 1 ? "s" : ""} : inscrivez moins de représentants.`
        : "Cet événement est complet.",
    );
  }

  // Une même adresse ne s'inscrit qu'une fois : un second envoi du
  // formulaire ne doublerait pas les places.
  const deja = await prisma.attendee.findFirst({
    where: {
      eventId,
      email: { equals: email, mode: "insensitive" },
      code: { not: null },
    },
    select: { code: true },
  });
  if (deja) {
    redirectWithErreur(
      fiche,
      `${email} est déjà inscrite à cet événement : l’e-mail de confirmation contient vos billets.`,
    );
  }

  const code = await codeAcces(eventId);
  const n = noms.length;
  const aRegler = event.payant ? fmtMoney(event.prix * n) : null;
  await prisma.$transaction([
    prisma.attendee.createMany({
      data: noms.map((nom, i) => ({
        eventId,
        nom,
        entreprise,
        email,
        telephone,
        statut: "confirme" as const,
        code: codeRepresentant(code, i),
      })),
    }),
    prisma.auditLog.create({
      data: {
        action: "inscription_publique",
        entite: "Event",
        entiteId: eventId,
        acteur: noms[0],
        detail: `« ${event.titre} » · ${entreprise} · ${n} personne${n > 1 ? "s" : ""} · ${email} · ${telephone}${aRegler ? ` · ${aRegler} à régler` : ""}.`,
      },
    }),
  ]);

  const lien = await urlPublique(
    `/public/evenements/${eventId}/billet?${new URLSearchParams({ code })}`,
  );
  after(() =>
    envoyerCourriel(
      courrielInscriptionEvenement(email, {
        evenement: event.titre,
        quand: [
          fmtDate(toISODate(event.date)),
          plageHoraire(event.debut, event.fin),
        ]
          .filter(Boolean)
          .join(" · "),
        lieu: event.lieu,
        participants: noms.map((nom, i) => ({
          nom,
          code: codeRepresentant(code, i),
        })),
        lien,
        aRegler,
      }),
    ),
  );

  revalideTout();
  redirect(
    `/public/evenements/${eventId}/billet?${new URLSearchParams({ code })}`,
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
        ...(inscription ? [lignesDe(inscription.code)] : []),
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
  await prisma.attendee.update({
    where: { id: attendeeId },
    data: {
      statut,
      presentLe: statut === "present" ? (a.presentLe ?? new Date()) : null,
    },
  });
  revalideTout();
  redirectWithFlash(
    retour,
    `${a.nom} — ${statut === "present" ? "présent" : "absent"}`,
  );
}

/** Ce que le scanner affiche après la lecture d'un code. */
/**
 * Une arrivée à l'accueil, telle que le scanner l'annonce et la garde dans
 * son historique : qui, pour quelle entreprise, à quelle heure — et de quoi
 * vérifier l'inscription d'un coup d'œil.
 */
export interface ArriveeAccueil {
  /** La ligne d'accueil. */
  id: string;
  representant: string;
  entreprise: string;
  email: string;
  telephone: string | null;
  code: string | null;
  /** Heure du pointage, ISO. */
  presentLe: string | null;
  /** Le membre inscrit. `null` pour une personne ajoutée par l'équipe. */
  membre: {
    id: string;
    nom: string;
    logo: string | null;
    photo: string | null;
    type: "morale" | "physique";
    statut: "candidature" | "en_attente" | "a_jour" | "en_retard";
    secteur: string;
    ville: string;
  } | null;
  /** Tous les représentants de la même inscription, celui-ci compris. */
  inscrits: {
    id: string;
    nom: string;
    statut: "confirme" | "present" | "absent";
  }[];
}

export type ResultatScan =
  | { etat: "present" | "deja"; code: string; arrivee: ArriveeAccueil }
  | { etat: "erreur"; code: string; message: string };

/** Les lignes d'accueil, complétées de leur membre et de leurs collègues. */
async function decrireArrivees(
  eventId: string,
  lignes: {
    id: string;
    nom: string;
    entreprise: string;
    email: string;
    telephone: string | null;
    code: string | null;
    presentLe: Date | null;
  }[],
): Promise<ArriveeAccueil[]> {
  const bases = [
    ...new Set(
      lignes.flatMap((l) => (l.code ? [codeInscription(l.code)] : [])),
    ),
  ];
  const [inscriptions, collegues] = bases.length
    ? await Promise.all([
        prisma.registration.findMany({
          where: { code: { in: bases } },
          select: {
            code: true,
            member: {
              select: {
                id: true,
                nom: true,
                logo: true,
                photo: true,
                type: true,
                statut: true,
                secteur: true,
                ville: true,
              },
            },
          },
        }),
        prisma.attendee.findMany({
          where: { eventId, OR: bases.map(lignesDe) },
          orderBy: { code: "asc" },
          select: { id: true, nom: true, statut: true, code: true },
        }),
      ])
    : [[], []];
  const membres = new Map(inscriptions.map((i) => [i.code, i.member]));

  return lignes.map((l) => {
    const base = l.code ? codeInscription(l.code) : null;
    return {
      id: l.id,
      representant: l.nom,
      entreprise: l.entreprise,
      email: l.email,
      telephone: l.telephone,
      code: l.code,
      presentLe: l.presentLe?.toISOString() ?? null,
      membre: (base && membres.get(base)) || null,
      inscrits: base
        ? collegues
            .filter((c) => c.code && codeInscription(c.code) === base)
            .map(({ id, nom, statut }) => ({ id, nom, statut }))
        : [{ id: l.id, nom: l.nom, statut: "present" as const }],
    };
  });
}

/**
 * L'historique du scanner : les personnes pointées présentes, la dernière
 * arrivée en tête. Il survit à la fermeture du scanner, puisqu'il se lit dans
 * la liste d'accueil.
 */
export async function historiqueAccueil(
  eventId: string,
): Promise<ArriveeAccueil[]> {
  await getCurrentUser("admin");
  const lignes = await prisma.attendee.findMany({
    where: { eventId, statut: "present" },
    orderBy: [{ presentLe: { sort: "desc", nulls: "last" } }, { nom: "asc" }],
    select: {
      id: true,
      nom: true,
      entreprise: true,
      email: true,
      telephone: true,
      code: true,
      presentLe: true,
    },
  });
  return decrireArrivees(eventId, lignes);
}

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
  const code = extraireCode(lu);
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

  if (ligne.statut === "present") {
    const [arrivee] = await decrireArrivees(eventId, [ligne]);
    return { etat: "deja", code, arrivee };
  }

  const pointee = await prisma.attendee.update({
    where: { id: ligne.id },
    data: { statut: "present", presentLe: new Date() },
  });
  revalideTout();
  const [arrivee] = await decrireArrivees(eventId, [pointee]);
  return { etat: "present", code, arrivee };
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
      presentLe: direct ? new Date() : null,
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
