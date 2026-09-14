"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { redirectWithFlash } from "@/lib/flash";
import { fmtMoney } from "@/lib/format";
import { COTISATION_ANNUELLE } from "@/lib/membership";
import type { MemberStatus, MemberType } from "@/lib/types";

/**
 * Actions sur les membres et les cotisations.
 *
 * Toute opération financière ou destructrice laisse une trace dans `audit_logs` :
 * une validation de paiement ou une suppression de membre ne doit jamais
 * disparaître silencieusement.
 */

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Numéro de facture séquentiel par année, ex. CC-2026-0008. */
async function numeroFacture(date: Date): Promise<string> {
  const annee = date.getFullYear();
  const n = await prisma.invoice.count({
    where: { numero: { startsWith: `CC-${annee}-` } },
  });
  return `CC-${annee}-${String(n + 1).padStart(4, "0")}`;
}

async function journal(
  action: string,
  entite: string,
  entiteId: string,
  acteur: string,
  detail?: string,
) {
  await prisma.auditLog.create({
    data: { action, entite, entiteId, acteur, detail },
  });
}

function revalideTout() {
  revalidatePath("/", "layout");
}

/* ============================ Candidatures ============================ */

/** Dépôt d'une demande depuis l'espace public. */
export async function submitAdhesion(formData: FormData) {
  const type = (texte(formData, "type") || "morale") as MemberType;
  const rep = texte(formData, "rep") || "À préciser";
  const nomSaisi = texte(formData, "nom");
  const nom = nomSaisi || (type === "physique" ? rep : "");

  if (!nom) {
    redirectWithFlash(
      "/public/adhesion",
      "Merci d’indiquer le nom de votre entreprise ou votre nom.",
    );
  }

  const email = texte(formData, "email") || "contact@entreprise.mg";

  const membre = await prisma.member.create({
    data: {
      type,
      nom,
      secteur: texte(formData, "secteur") || "Secteur à préciser",
      ville: texte(formData, "ville") || "Antananarivo",
      statut: "candidature",
      adhesion: new Date(),
      activite: texte(formData, "desc").slice(0, 120) || "Activité à préciser.",
      desc: texte(formData, "desc") || "Description à compléter.",
      statutJuridique: texte(formData, "statutJuridique") || null,
      pays: texte(formData, "pays") || null,
      siteweb: texte(formData, "siteweb") || null,
      motivation: texte(formData, "motivation") || "À compléter.",
      produits: { create: [{ label: "Fiche à compléter", ordre: 0 }] },
    },
  });

  // Le représentant devient le contact principal de l'entreprise.
  const dejaPris = await prisma.user.findUnique({ where: { email } });
  if (!dejaPris) {
    await prisma.user.create({
      data: {
        role: "visiteur",
        nom: rep,
        fonction:
          texte(formData, "repTitre") ||
          (type === "physique" ? "Indépendant(e)" : "Représentant(e)"),
        email,
        tel: texte(formData, "tel") || null,
        memberId: membre.id,
        contactPrincipal: true,
      },
    });
  }

  await journal("candidature_deposee", "Member", membre.id, rep, `Demande de ${nom}.`);
  revalideTout();
  redirect(`/public/adhesion/confirmation?nom=${encodeURIComponent(nom)}`);
}

/** Approbation : la demande devient une adhésion en attente de règlement. */
export async function approveCandidature(formData: FormData) {
  const id = texte(formData, "memberId");
  const m = await prisma.member.update({
    where: { id },
    data: { statut: "en_attente" },
  });
  await journal("candidature_approuvee", "Member", id, "Équipe CanCham");
  revalideTout();
  redirectWithFlash(
    `/admin/membres/${id}`,
    `Demande approuvée pour ${m.nom} · en attente du paiement de la cotisation`,
  );
}

export async function rejectCandidature(formData: FormData) {
  const id = texte(formData, "memberId");
  const m = await prisma.member.findUnique({ where: { id }, select: { nom: true } });
  await journal(
    "candidature_refusee",
    "Member",
    id,
    "Équipe CanCham",
    `Demande de ${m?.nom ?? id} refusée.`,
  );
  await prisma.member.delete({ where: { id } });
  revalideTout();
  redirectWithFlash("/admin/membres", `Demande de ${m?.nom ?? "ce candidat"} refusée`);
}

/* ============================ Cotisations ============================ */

/** Enregistrement d'un règlement encaissé par l'équipe. Génère la facture. */
export async function registerPayment(formData: FormData) {
  const id = texte(formData, "memberId");
  const mode = texte(formData, "mode") || "Espèces";
  const montant = Number(formData.get("montant")) || COTISATION_ANNUELLE;
  const dateSaisie = texte(formData, "date");
  const date = dateSaisie ? new Date(`${dateSaisie}T00:00:00`) : new Date();
  const note = texte(formData, "note");

  const avant = await prisma.member.findUnique({
    where: { id },
    select: { nom: true, paiementNote: true },
  });
  if (!avant) redirectWithFlash("/admin/membres", "Membre introuvable.");

  const premier = !avant.paiementNote;
  const numero = await numeroFacture(date);

  await prisma.$transaction([
    prisma.member.update({
      where: { id },
      data: {
        statut: "a_jour",
        retardDepuis: null,
        ...(premier ? { adhesion: date } : {}),
        paiementNote: `Payé par ${mode.toLowerCase()} · ${fmtMoney(montant)} · le ${date.toLocaleDateString("fr-FR")}${note ? ` · ${note}` : ""}`,
      },
    }),
    prisma.invoice.create({
      data: {
        numero,
        date,
        objet: premier ? "Cotisation annuelle — adhésion" : "Cotisation annuelle",
        montant,
        statut: "payee",
        memberId: id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "paiement_enregistre",
        entite: "Invoice",
        entiteId: numero,
        acteur: "Équipe CanCham",
        detail: `${fmtMoney(montant)} par ${mode} pour ${avant.nom}.`,
      },
    }),
  ]);

  revalideTout();
  redirectWithFlash(
    `/admin/membres/${id}`,
    `${premier ? "Adhésion activée" : "Paiement enregistré"} pour ${avant.nom} · facture ${numero} générée`,
  );
}

/** Relance de cotisation. Rien n'est envoyé tant que l'e-mail n'est pas branché. */
export async function sendReminder(formData: FormData) {
  const id = texte(formData, "memberId");
  const m = await prisma.member.findUnique({
    where: { id },
    select: { nom: true, users: { select: { email: true }, take: 1 } },
  });
  const email = m?.users[0]?.email ?? "l’adresse du membre";
  await journal(
    "relance_envoyee",
    "Member",
    id,
    "Équipe CanCham",
    `Relance de cotisation pour ${m?.nom}.`,
  );
  revalideTout();
  redirectWithFlash(
    `/admin/membres/${id}`,
    `Relance consignée pour ${email} — l’envoi réel viendra avec le service d’e-mails`,
  );
}

/* ============================ Fiche membre ============================ */

export async function createMember(formData: FormData) {
  const type = (texte(formData, "type") || "morale") as MemberType;
  const rep = texte(formData, "rep") || "À préciser";
  const nomSaisi = texte(formData, "nom");
  const nom = nomSaisi || (type === "physique" ? rep : "");

  if (!nom) {
    redirectWithFlash("/admin/membres", "Le nom de l’entreprise est requis.");
  }

  const m = await prisma.member.create({
    data: {
      type,
      nom,
      secteur: texte(formData, "secteur") || "Secteur à préciser",
      ville: texte(formData, "ville") || "Antananarivo",
      statut: (texte(formData, "statut") || "en_attente") as MemberStatus,
      adhesion: new Date(),
      activite: texte(formData, "desc").slice(0, 120) || "Activité à préciser.",
      desc: texte(formData, "desc") || "Description à compléter.",
      produits: { create: [{ label: "Fiche à compléter", ordre: 0 }] },
    },
  });

  const email = texte(formData, "email");
  if (email && !(await prisma.user.findUnique({ where: { email } }))) {
    await prisma.user.create({
      data: {
        role: "membre",
        nom: rep,
        fonction: texte(formData, "repTitre") || "Représentant(e)",
        email,
        tel: texte(formData, "tel") || null,
        memberId: m.id,
        contactPrincipal: true,
      },
    });
  }

  await journal("membre_cree", "Member", m.id, "Équipe CanCham", `Ajout manuel de ${nom}.`);
  revalideTout();
  redirectWithFlash(`/admin/membres/${m.id}`, `${nom} a été ajouté à l’annuaire`);
}

/** Mise à jour de la fiche par le membre lui-même. */
export async function updateMemberProfile(formData: FormData) {
  const id = texte(formData, "memberId");
  const labels = [0, 1, 2]
    .map((i) => texte(formData, `produit${i}`))
    .filter(Boolean);

  await prisma.$transaction([
    prisma.member.update({
      where: { id },
      data: {
        activite: texte(formData, "activite") || undefined,
        desc: texte(formData, "desc") || undefined,
        besoins: texte(formData, "besoins") || null,
        interets: texte(formData, "interets") || null,
      },
    }),
    prisma.produit.deleteMany({ where: { memberId: id } }),
    prisma.produit.createMany({
      data: (labels.length ? labels : ["Fiche à compléter"]).map((label, ordre) => ({
        memberId: id,
        label,
        ordre,
      })),
    }),
  ]);

  revalideTout();
  redirectWithFlash("/membre/profil", "Fiche mise à jour");
}

export async function deleteMember(formData: FormData) {
  const id = texte(formData, "memberId");
  const m = await prisma.member.findUnique({ where: { id }, select: { nom: true } });
  await journal(
    "membre_supprime",
    "Member",
    id,
    "Équipe CanCham",
    `Suppression de ${m?.nom ?? id} et de ses accès.`,
  );
  await prisma.member.delete({ where: { id } });
  revalideTout();
  redirectWithFlash("/admin/membres", `${m?.nom ?? "Le membre"} a été retiré de l’annuaire`);
}
