"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { nomFacture, numeroFacture } from "@/lib/factures";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { fmtMontant, type Devise } from "@/lib/membership";
import { ajouterAns } from "@/lib/agenda";
import { jourBase, jourSaisi } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

const MODES = ["Espèces", "Virement bancaire", "Mobile Money", "Chèque"];

/** Une date saisie (AAAA-MM-JJ), sinon aujourd'hui. */
function dateSaisie(fd: FormData, k: string): Date {
  return jourBase(jourSaisi(texte(fd, k)) ?? undefined);
}

/**
 * Une cotisation réglée remet le membre à jour.
 *
 * C'est l'objet de la facture qui le dit : les participations à un
 * événement ou les stands n'ont pas d'effet sur l'adhésion.
 */
const estCotisation = (objet: string) => /^cotisation/i.test(objet);

/**
 * Émission d'une facture hors cotisation automatique : stand, participation,
 * prestation. Elle peut être créée déjà réglée, si l'argent est encaissé.
 */
export async function creerFacture(formData: FormData) {
  const memberId = texte(formData, "memberId");
  const objet = texte(formData, "objet");
  const montant = Math.round(Number(formData.get("montant")));
  const devise: Devise = texte(formData, "devise") === "CAD" ? "CAD" : "MGA";
  const payee = texte(formData, "statut") === "payee";
  const mode = MODES.includes(texte(formData, "mode"))
    ? texte(formData, "mode")
    : "Espèces";
  const date = dateSaisie(formData, "date");
  const retour = "/admin/paiements";

  const membre = await prisma.member.findUnique({
    where: { id: memberId },
    select: { nom: true, statut: true },
  });
  if (!membre) redirectWithErreur(retour, "Choisissez le membre facturé.");
  if (!objet) redirectWithErreur(retour, "Indiquez l’objet de la facture.");
  if (!Number.isFinite(montant) || montant <= 0) {
    redirectWithErreur(retour, "Le montant doit être un nombre positif.");
  }

  const acteur = (await getCurrentUser("admin")).nom;
  const numero = await numeroFacture(date);
  const cotisation = payee && estCotisation(objet);

  const facture = await prisma.$transaction(async (tx) => {
    const f = await tx.invoice.create({
      data: {
        numero,
        date,
        objet,
        montant,
        devise,
        statut: payee ? "payee" : "envoyee",
        memberId,
      },
    });
    if (cotisation) {
      await tx.member.update({
        where: { id: memberId },
        data: {
          statut: "a_jour",
          retardDepuis: null,
          paiementNote: `Payé par ${mode.toLowerCase()} · ${fmtMontant(montant, devise)} · le ${date.toLocaleDateString("fr-FR", { timeZone: "UTC" })}`,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        action: payee ? "paiement_enregistre" : "facture_emise",
        entite: "Invoice",
        entiteId: numero,
        acteur,
        detail: payee
          ? `${fmtMontant(montant, devise)} par ${mode.toLowerCase()} pour ${membre.nom} · ${objet}.`
          : `${fmtMontant(montant, devise)} à régler par ${membre.nom} · ${objet}.`,
      },
    });
    return f;
  });

  revalidatePath("/", "layout");
  redirectWithFlash(
    `/admin/paiements/${facture.id}`,
    `Facture ${numero} émise${payee ? " et réglée" : ""}${cotisation ? ` · ${membre.nom} passe à jour` : ""}`,
  );
}

/**
 * Règlement d'une facture émise.
 *
 * Pour une cotisation, le membre repasse à jour dans la même transaction :
 * une facture payée à côté d'un membre resté « en attente » serait une
 * contradiction que personne ne verrait.
 */
export async function marquerFacturePayee(formData: FormData) {
  const id = texte(formData, "factureId");
  const mode = MODES.includes(texte(formData, "mode"))
    ? texte(formData, "mode")
    : "Espèces";
  const date = dateSaisie(formData, "date");

  const f = await prisma.invoice.findUnique({
    where: { id },
    include: { member: { select: { id: true, nom: true, statut: true } } },
  });
  if (!f) redirectWithErreur("/admin/paiements", "Facture introuvable.");
  const retour = `/admin/paiements/${id}`;
  if (f.statut === "payee") redirect(retour);

  const acteur = (await getCurrentUser("admin")).nom;
  // Membre supprimé depuis l'émission : la facture se règle quand même, sans
  // adhésion à remettre à jour.
  const membre = f.member;
  const nom = nomFacture(f);
  const cotisation =
    membre !== null && estCotisation(f.objet) && membre.statut !== "a_jour";
  const montant = fmtMontant(f.montant, f.devise);

  await prisma.$transaction([
    prisma.invoice.update({ where: { id }, data: { statut: "payee" } }),
    ...(cotisation
      ? [
          prisma.member.update({
            where: { id: membre.id },
            data: {
              statut: "a_jour",
              retardDepuis: null,
              paiementNote: `Payé par ${mode.toLowerCase()} · ${montant} · le ${date.toLocaleDateString("fr-FR", { timeZone: "UTC" })}`,
            },
          }),
        ]
      : []),
    prisma.auditLog.create({
      data: {
        action: "facture_payee",
        entite: "Invoice",
        entiteId: f.numero,
        acteur,
        detail: `${montant} par ${mode.toLowerCase()} le ${date.toLocaleDateString("fr-FR", { timeZone: "UTC" })} pour ${nom}.`,
      },
    }),
  ]);

  revalidatePath("/", "layout");
  redirectWithFlash(
    retour,
    `Facture ${f.numero} réglée${cotisation ? ` · ${nom} passe à jour` : ""}`,
  );
}

/**
 * Suppression d'une facture émise par erreur.
 *
 * La pièce disparaît des totaux et de l'historique du membre ; son numéro,
 * son montant et son objet restent au journal, qui dit qui l'a supprimée —
 * une facture ne s'efface pas sans laisser de trace. Le numéro n'est pas
 * réattribué tant qu'une facture plus récente existe dans l'année.
 */
export async function supprimerFacture(formData: FormData) {
  const acteur = (await getCurrentUser("admin")).nom;
  const id = texte(formData, "factureId");
  const f = await prisma.invoice.findUnique({
    where: { id },
    include: { member: { select: { nom: true } } },
  });
  if (!f) redirectWithErreur("/admin/paiements", "Facture introuvable.");

  await prisma.$transaction([
    prisma.auditLog.create({
      data: {
        action: "facture_supprimee",
        entite: "Invoice",
        entiteId: f.numero,
        acteur,
        detail: `${f.numero} · ${fmtMontant(f.montant, f.devise)} · ${nomFacture(f)} · ${f.objet}${f.statut === "payee" ? " · elle était réglée" : ""}.`,
      },
    }),
    prisma.invoice.delete({ where: { id } }),
  ]);

  revalidatePath("/", "layout");
  redirectWithFlash("/admin/paiements", `Facture ${f.numero} supprimée`);
}

/**
 * Correction de la date du dernier règlement de cotisation d'un membre.
 *
 * C'est cette date qui ouvre l'année d'adhésion : le renouvellement tombe un
 * an après, jour pour jour. Une date saisie de travers décalait donc toute
 * l'échéance, sans moyen de la reprendre.
 *
 * La date vit sur la facture, et nulle part ailleurs : une copie sur la fiche
 * du membre finirait par contredire la pièce comptable. La mention « Dernier
 * règlement » de la fiche n'est qu'un libellé — on y remplace le jour pour
 * qu'elle ne raconte pas autre chose.
 */
export async function modifierDateReglement(formData: FormData) {
  const memberId = texte(formData, "memberId");
  const retour = `/admin/membres/${memberId}`;
  const jour = jourSaisi(texte(formData, "date"));
  if (!jour) redirectWithErreur(retour, "Indiquez une date valide.");

  const acteur = (await getCurrentUser("admin")).nom;

  const derniere = await prisma.invoice.findFirst({
    where: {
      memberId,
      statut: "payee",
      objet: { startsWith: "Cotisation", mode: "insensitive" },
    },
    // À dates égales, la dernière émise : l'ordre doit être le même d'un
    // appel à l'autre, sinon le crayon corrigerait une fois l'une, une fois
    // l'autre.
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      numero: true,
      date: true,
      member: { select: { nom: true, paiementNote: true } },
    },
  });
  if (!derniere) {
    redirectWithErreur(
      retour,
      "Aucun règlement de cotisation n’est enregistré pour ce membre : enregistrez-en un, ou modifiez sa date d’adhésion.",
    );
  }

  const ancienne = derniere.date.toISOString().slice(0, 10);
  if (ancienne === jour)
    redirectWithFlash(retour, "Date de règlement inchangée");

  const lisible = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("fr-FR", {
      timeZone: "UTC",
    });

  // Le libellé de la fiche porte la date en toutes lettres : on y reprend la
  // nouvelle, sans toucher au mode ni au montant qu'il annonce.
  const note = derniere.member?.paiementNote ?? null;
  const noteAJour = note
    ? /le \d{1,2}\/\d{1,2}\/\d{4}/.test(note)
      ? note.replace(/le \d{1,2}\/\d{1,2}\/\d{4}/, `le ${lisible(jour)}`)
      : `${note} · le ${lisible(jour)}`
    : null;

  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: derniere.id },
      data: { date: jourBase(jour) },
    }),
    ...(noteAJour
      ? [
          prisma.member.update({
            where: { id: memberId },
            data: { paiementNote: noteAJour },
          }),
        ]
      : []),
    prisma.auditLog.create({
      data: {
        action: "reglement_modifie",
        entite: "Member",
        entiteId: memberId,
        acteur,
        detail: `${derniere.member?.nom ?? "Membre"} · règlement ${derniere.numero} : du ${lisible(ancienne)} au ${lisible(jour)}.`,
      },
    }),
  ]);

  // Un membre peut porter plusieurs cotisations réglées : c'est la plus
  // récente qui fixe le renouvellement. Si une autre reste devant, le
  // renouvellement ne bouge pas — autant le dire que de laisser croire.
  const devant = await prisma.invoice.findFirst({
    where: {
      memberId,
      statut: "payee",
      objet: { startsWith: "Cotisation", mode: "insensitive" },
      date: { gt: jourBase(jour) },
    },
    orderBy: { date: "desc" },
    select: { numero: true, date: true },
  });

  revalidatePath("/", "layout");
  redirectWithFlash(
    retour,
    devant
      ? `Règlement du ${lisible(jour)} · le renouvellement ne bouge pas : la cotisation ${devant.numero} du ${lisible(devant.date.toISOString().slice(0, 10))} reste la plus récente`
      : `Règlement du ${lisible(jour)} · renouvellement le ${lisible(ajouterAns(jour, 1))}`,
  );
}
