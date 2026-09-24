"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { espaceDe, estHeure, estJourISO, plageHoraire } from "@/lib/agenda";
import { exigerEquipe } from "@/lib/autorisations";
import { COURRIEL_EQUIPE, envoyerCourriel, urlPublique } from "@/lib/courriel";
import { prisma } from "@/lib/db";
import { toISODate } from "@/lib/enums";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { aujourdhuiISO, fmtDate, jourBase } from "@/lib/format";
import {
  courrielRendezvousAnnule,
  courrielRendezvousEquipe,
  courrielRendezvousPris,
} from "@/lib/modeles-courriels";
import { maintenant } from "@/lib/presences";
import {
  chevauche,
  creneauxLibres,
  finCreneau,
  JOURS_SEMAINE,
  type Plage,
} from "@/lib/rendezvous";
import { getCurrentUser } from "@/lib/session";

/**
 * Rendez-vous avec l'équipe : réservation par un membre, et réglages côté
 * back-office.
 *
 * Le créneau réservé est toujours recalculé au moment d'écrire : une page
 * restée ouverte propose des heures qui ne sont plus libres, et l'heure reçue
 * du formulaire ne prouve rien. Si deux membres cliquent en même temps, c'est
 * la base qui tranche — un index unique n'autorise qu'un rendez-vous vivant
 * par créneau.
 *
 * Toutes les heures sont celles de Madagascar, celles de la chambre.
 */

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const nombre = (fd: FormData, k: string) => Number(texte(fd, k));

const MEMBRE = "/membre/rendez-vous";
const EQUIPE = "/admin/rendez-vous";

const MOTIF_MAX = 500;
const TITRE_MAX = 80;
const DETAIL_MAX = 200;
/** Bornes d'une durée de rendez-vous, en minutes. */
const DUREE_MIN = 10;
const DUREE_MAX = 240;

/** Les deux pages se relisent : un créneau pris disparaît des deux côtés. */
function revalider() {
  revalidatePath(MEMBRE);
  revalidatePath(EQUIPE);
  revalidatePath("/membre/agenda");
  revalidatePath("/admin/agenda");
}

/** « mercredi 30 septembre 2026 » : la date telle que l'e-mail l'annonce. */
const jourLong = (iso: string) =>
  fmtDate(iso, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** Ce qu'un e-mail de rendez-vous répète, quel qu'en soit le destinataire. */
async function annonce(r: {
  jour: Date;
  debut: string;
  fin: string;
  motif: string | null;
  type: { titre: string };
  user: { nom: string };
  member: { nom: string } | null;
}) {
  const jour = toISODate(r.jour);
  return {
    type: r.type.titre,
    jour: jourLong(jour),
    horaire: plageHoraire(r.debut, r.fin) ?? r.debut,
    personne: r.user.nom,
    entreprise: r.member?.nom ?? null,
    motif: r.motif,
    lien: await urlPublique(MEMBRE),
  };
}

/* ============================ Côté membre ============================ */

/**
 * Réservation d'un créneau par un membre.
 *
 * Le type donne la durée, et le créneau doit figurer parmi ceux encore
 * libres ce jour-là : hors plage d'accueil, trop proche ou déjà pris, la
 * réservation est refusée avec son motif.
 */
export async function reserverRendezvous(formData: FormData) {
  const user = await getCurrentUser("membre");
  const jour = texte(formData, "jour");
  const debut = texte(formData, "debut");
  const motif = texte(formData, "motif").slice(0, MOTIF_MAX);

  if (!estJourISO(jour) || !estHeure(debut)) {
    redirectWithErreur(MEMBRE, "Choisissez un jour et une heure.");
  }
  if (jour < aujourdhuiISO()) {
    redirectWithErreur(MEMBRE, "Ce créneau est passé.");
  }

  const type = await prisma.typeRendezvous.findUnique({
    where: { id: texte(formData, "typeId") },
    select: { id: true, titre: true, duree: true, actif: true },
  });
  if (!type || !type.actif) {
    redirectWithErreur(MEMBRE, "Ce type de rendez-vous n’est plus proposé.");
  }

  // L'heure reçue est vérifiée contre les créneaux réellement libres, pas
  // contre ceux qu'affichait la page : elle a pu vieillir.
  const [plages, pris] = await Promise.all([
    prisma.disponibilite.findMany({
      where: { typeId: type.id },
      select: { jour: true, debut: true, fin: true },
    }),
    prisma.rendezvous.findMany({
      where: { jour: jourBase(jour), annuleLe: null },
      select: { debut: true, fin: true },
    }),
  ]);
  const libres = creneauxLibres({
    jour,
    plages,
    duree: type.duree,
    occupes: pris,
    maintenant: maintenant(),
  });
  if (!libres.includes(debut)) {
    redirectWithErreur(
      MEMBRE,
      "Ce créneau n’est plus disponible. Choisissez-en un autre.",
    );
  }

  let rendezvous;
  try {
    rendezvous = await prisma.rendezvous.create({
      data: {
        typeId: type.id,
        userId: user.id,
        memberId: user.memberId,
        jour: jourBase(jour),
        debut,
        fin: finCreneau(debut, type.duree),
        motif: motif || null,
      },
      select: {
        id: true,
        jour: true,
        debut: true,
        fin: true,
        motif: true,
        type: { select: { titre: true } },
        user: { select: { nom: true, email: true } },
        member: { select: { nom: true } },
      },
    });
  } catch (e) {
    // Deux clics au même instant : l'index unique du créneau en refuse un.
    if ((e as { code?: string }).code !== "P2002") throw e;
    redirectWithErreur(
      MEMBRE,
      "Quelqu’un vient de prendre ce créneau. Choisissez-en un autre.",
    );
  }

  const details = await annonce(rendezvous);
  after(async () => {
    await envoyerCourriel(
      courrielRendezvousPris(rendezvous.user.email, details),
    );
    await envoyerCourriel(
      courrielRendezvousEquipe(COURRIEL_EQUIPE, {
        ...details,
        lien: await urlPublique(EQUIPE),
      }),
    );
  });

  await prisma.auditLog.create({
    data: {
      action: "rendezvous_pris",
      entite: "Rendezvous",
      entiteId: rendezvous.id,
      acteur: user.nom,
      detail: `« ${details.type} » le ${details.jour}, ${details.horaire}${
        details.entreprise ? ` · ${details.entreprise}` : ""
      }.`,
    },
  });

  revalider();
  redirectWithFlash(
    MEMBRE,
    `Rendez-vous confirmé — ${details.jour}, ${details.horaire}`,
  );
}

/* ==================== Annulation, des deux côtés ==================== */

/**
 * Annulation d'un rendez-vous, par le membre qui l'a pris ou par l'équipe.
 *
 * Le rendez-vous n'est pas effacé : il garde sa trace d'annulation, et son
 * créneau redevient libre — l'index unique ne compte que les rendez-vous qui
 * tiennent encore.
 */
export async function annulerRendezvous(formData: FormData) {
  const page = texte(formData, "retour").startsWith("/admin") ? EQUIPE : MEMBRE;
  const user = await getCurrentUser(espaceDe(page));

  const rendezvous = await prisma.rendezvous.findUnique({
    where: { id: texte(formData, "rendezvousId") },
    select: {
      id: true,
      userId: true,
      jour: true,
      debut: true,
      fin: true,
      motif: true,
      annuleLe: true,
      type: { select: { titre: true } },
      user: { select: { nom: true, email: true } },
      member: { select: { nom: true } },
    },
  });
  if (!rendezvous || (user.role !== "admin" && rendezvous.userId !== user.id)) {
    redirectWithErreur(page, "Ce rendez-vous n’existe plus.");
  }
  if (rendezvous.annuleLe) {
    redirectWithErreur(page, "Ce rendez-vous est déjà annulé.");
  }

  await prisma.rendezvous.update({
    where: { id: rendezvous.id },
    data: { annuleLe: new Date(), annulePar: user.nom },
  });

  const details = await annonce(rendezvous);
  // Celui qui annule le sait déjà : l'e-mail part à l'autre partie.
  const parLeMembre = rendezvous.userId === user.id;
  after(async () =>
    envoyerCourriel(
      courrielRendezvousAnnule(
        parLeMembre ? COURRIEL_EQUIPE : rendezvous.user.email,
        {
          ...details,
          par: parLeMembre ? user.nom : "l’équipe CanCham",
          lien: await urlPublique(parLeMembre ? EQUIPE : MEMBRE),
        },
      ),
    ),
  );

  await prisma.auditLog.create({
    data: {
      action: "rendezvous_annule",
      entite: "Rendezvous",
      entiteId: rendezvous.id,
      acteur: user.nom,
      detail: `« ${details.type} » du ${details.jour}, ${details.horaire} — annulé par ${
        parLeMembre ? "le membre" : "l’équipe"
      }.`,
    },
  });

  revalider();
  redirectWithFlash(
    page,
    "Rendez-vous annulé, le créneau est de nouveau libre",
  );
}

/* ============================ Côté équipe ============================ */

/** Trace d'un changement de réglages, pour le journal de l'équipe. */
async function tracerReglage(acteur: string, detail: string) {
  await prisma.auditLog.create({
    data: {
      action: "rendezvous_reglages",
      entite: "Rendezvous",
      entiteId: "reglages",
      acteur,
      detail,
    },
  });
}

/** Nombre de plages qu'un type peut porter : de quoi couvrir une semaine. */
const PLAGES_MAX = 20;

/**
 * Les heures d'accueil saisies dans le formulaire d'un type.
 *
 * Elles arrivent en JSON — le formulaire en ajoute et en retire des lignes,
 * ce qu'un champ répété rendrait illisible. Tout est revérifié ici : le
 * navigateur ne prouve rien.
 */
function lirePlages(formData: FormData): Plage[] {
  const brut = texte(formData, "plages");
  if (!brut) return [];

  let lignes: unknown;
  try {
    lignes = JSON.parse(brut);
  } catch {
    redirectWithErreur(EQUIPE, "Les heures d’accueil n’ont pas été comprises.");
  }
  if (!Array.isArray(lignes)) {
    redirectWithErreur(EQUIPE, "Les heures d’accueil n’ont pas été comprises.");
  }
  if (lignes.length > PLAGES_MAX) {
    redirectWithErreur(EQUIPE, `${PLAGES_MAX} plages au plus par type.`);
  }

  const plages: Plage[] = [];
  for (const l of lignes as {
    jour?: unknown;
    debut?: unknown;
    fin?: unknown;
  }[]) {
    const jour = Number(l?.jour);
    const debut = String(l?.debut ?? "");
    const fin = String(l?.fin ?? "");
    const libelle = JOURS_SEMAINE.find((j) => j.cle === jour)?.libelle;

    if (!libelle)
      redirectWithErreur(EQUIPE, "Choisissez un jour de la semaine.");
    if (!estHeure(debut) || !estHeure(fin)) {
      redirectWithErreur(EQUIPE, "Les heures s’écrivent HH:MM.");
    }
    if (fin <= debut) {
      redirectWithErreur(
        EQUIPE,
        `${libelle} : la fin doit venir après le début.`,
      );
    }
    // Deux plages qui se recouvrent offriraient deux fois le même créneau.
    if (plages.some((p) => p.jour === jour && chevauche(p, { debut, fin }))) {
      redirectWithErreur(EQUIPE, `${libelle} : deux plages se chevauchent.`);
    }
    plages.push({ jour, debut, fin });
  }
  return plages;
}

/**
 * Création ou modification d'un type de rendez-vous, avec ses heures
 * d'accueil : c'est le couple durée + plages qui donne des créneaux, et il se
 * règle donc d'un seul geste.
 */
export async function enregistrerTypeRendezvous(formData: FormData) {
  const user = await exigerEquipe();
  const id = texte(formData, "typeId");
  const titre = texte(formData, "titre").slice(0, TITRE_MAX);
  const detail = texte(formData, "detail").slice(0, DETAIL_MAX);
  const duree = nombre(formData, "duree");
  const actif = texte(formData, "actif") === "1";
  const plages = lirePlages(formData);

  if (!titre) redirectWithErreur(EQUIPE, "Donnez un titre à ce rendez-vous.");
  if (!Number.isInteger(duree) || duree < DUREE_MIN || duree > DUREE_MAX) {
    redirectWithErreur(
      EQUIPE,
      `La durée va de ${DUREE_MIN} à ${DUREE_MAX} minutes.`,
    );
  }

  const data = { titre, detail: detail || null, duree, actif };
  if (id) {
    const existant = await prisma.typeRendezvous.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existant) redirectWithErreur(EQUIPE, "Ce type n’existe plus.");
    // Les plages sont réécrites en bloc : le formulaire porte la liste
    // entière, et les rendez-vous déjà pris ne dépendent pas d'elles.
    await prisma.$transaction([
      prisma.disponibilite.deleteMany({ where: { typeId: id } }),
      prisma.typeRendezvous.update({
        where: { id },
        data: { ...data, plages: { create: plages } },
      }),
    ]);
  } else {
    // Le nouveau type passe en dernier : l'ordre reste celui de l'équipe.
    const dernier = await prisma.typeRendezvous.findFirst({
      orderBy: { ordre: "desc" },
      select: { ordre: true },
    });
    await prisma.typeRendezvous.create({
      data: {
        ...data,
        ordre: (dernier?.ordre ?? 0) + 1,
        plages: { create: plages },
      },
    });
  }

  await tracerReglage(
    user.nom,
    `${id ? "Type modifié" : "Type ajouté"} : « ${titre} » · ${duree} minutes · ${
      plages.length
        ? plages
            .map(
              (p) =>
                `${JOURS_SEMAINE.find((j) => j.cle === p.jour)?.libelle} ${p.debut}–${p.fin}`,
            )
            .join(", ")
        : "aucune heure d’accueil"
    }${actif ? "" : " · masqué"}.`,
  );
  revalider();
  redirectWithFlash(
    EQUIPE,
    id ? "Type mis à jour" : `Type « ${titre} » ajouté`,
  );
}

/**
 * Retrait d'un type. Des rendez-vous y sont peut-être rattachés : dans ce
 * cas il est masqué au lieu d'être supprimé, pour ne pas effacer leur
 * historique.
 */
export async function supprimerTypeRendezvous(formData: FormData) {
  const user = await exigerEquipe();
  const type = await prisma.typeRendezvous.findUnique({
    where: { id: texte(formData, "typeId") },
    select: { id: true, titre: true, _count: { select: { rendezvous: true } } },
  });
  if (!type) redirectWithErreur(EQUIPE, "Ce type n’existe plus.");

  if (type._count.rendezvous > 0) {
    await prisma.typeRendezvous.update({
      where: { id: type.id },
      data: { actif: false },
    });
    await tracerReglage(user.nom, `Type masqué : « ${type.titre} ».`);
    revalider();
    redirectWithFlash(
      EQUIPE,
      `« ${type.titre} » n’est plus proposé : des rendez-vous y sont rattachés, il est masqué plutôt que supprimé.`,
    );
  }

  await prisma.typeRendezvous.delete({ where: { id: type.id } });
  await tracerReglage(user.nom, `Type supprimé : « ${type.titre} ».`);
  revalider();
  redirectWithFlash(EQUIPE, `Type « ${type.titre} » supprimé`);
}
