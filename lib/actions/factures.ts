"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { numeroFacture } from "@/lib/factures";
import { redirectWithFlash } from "@/lib/flash";
import { fmtMontant, type Devise } from "@/lib/membership";
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
  if (!membre) redirectWithFlash(retour, "Choisissez le membre facturé.");
  if (!objet) redirectWithFlash(retour, "Indiquez l’objet de la facture.");
  if (!Number.isFinite(montant) || montant <= 0) {
    redirectWithFlash(retour, "Le montant doit être un nombre positif.");
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
  if (!f) redirectWithFlash("/admin/paiements", "Facture introuvable.");
  const retour = `/admin/paiements/${id}`;
  if (f.statut === "payee") redirect(retour);

  const acteur = (await getCurrentUser("admin")).nom;
  const cotisation = estCotisation(f.objet) && f.member.statut !== "a_jour";
  const montant = fmtMontant(f.montant, f.devise);

  await prisma.$transaction([
    prisma.invoice.update({ where: { id }, data: { statut: "payee" } }),
    ...(cotisation
      ? [
          prisma.member.update({
            where: { id: f.member.id },
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
        detail: `${montant} par ${mode.toLowerCase()} le ${date.toLocaleDateString("fr-FR", { timeZone: "UTC" })} pour ${f.member.nom}.`,
      },
    }),
  ]);

  revalidatePath("/", "layout");
  redirectWithFlash(
    retour,
    `Facture ${f.numero} réglée${cotisation ? ` · ${f.member.nom} passe à jour` : ""}`,
  );
}
