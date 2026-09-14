"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { RESOURCE_CAT_DB } from "@/lib/enums";
import { redirectWithFlash } from "@/lib/flash";
import { getCurrentUser } from "@/lib/session";
import type { NewsCategory, ResourceCategory, Space } from "@/lib/types";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const revalideTout = () => revalidatePath("/", "layout");

const NEWS_CAT_DB: Record<NewsCategory, "programmation" | "evenement_passe" | "vie_de_la_chambre" | "formation"> = {
  Programmation: "programmation",
  "Événement passé": "evenement_passe",
  "Vie de la chambre": "vie_de_la_chambre",
  Formation: "formation",
};

/* ============================ Actualités ============================ */

export async function createNews(formData: FormData) {
  const mediaType = texte(formData, "mediaType") === "video" ? "video" : "image";
  const n = await prisma.news.create({
    data: {
      titre: texte(formData, "titre") || "Nouvelle actualité",
      date: new Date(),
      cat: NEWS_CAT_DB[(texte(formData, "cat") || "Vie de la chambre") as NewsCategory],
      extrait: texte(formData, "extrait") || "Résumé à compléter.",
      corps: texte(formData, "corps") || "Texte à compléter.",
      mediaType,
      mediaTheme: Math.random() > 0.5 ? "navy" : "green",
      mediaDuration: mediaType === "video" ? texte(formData, "duree") || "2:00" : null,
    },
  });
  revalideTout();
  redirectWithFlash(`/admin/actualites/${n.id}`, "Actualité publiée");
}

export async function deleteNews(formData: FormData) {
  const id = texte(formData, "newsId");
  await prisma.news.delete({ where: { id } });
  revalideTout();
  redirectWithFlash("/admin/actualites", "Actualité supprimée");
}

/* ============================ Commentaires ============================ */

/** Commentaire sur une actualité ou une ressource. */
export async function postComment(formData: FormData) {
  const texteCommentaire = texte(formData, "texte");
  const space = (texte(formData, "space") || "membre") as Space;
  const retour = texte(formData, "retour") || `/${space}/actualites`;

  if (!texteCommentaire) {
    redirectWithFlash(retour, "Le commentaire est vide.");
  }

  const user = await getCurrentUser(space);
  const entreprise = user.memberId
    ? ((await prisma.member.findUnique({
        where: { id: user.memberId },
        select: { nom: true },
      }))?.nom ?? "—")
    : "Équipe CanCham";

  const newsId = texte(formData, "newsId") || null;
  const resourceId = texte(formData, "resourceId") || null;

  await prisma.comment.create({
    data: {
      auteur: user.nom,
      entreprise,
      texte: texteCommentaire,
      date: new Date(),
      newsId,
      resourceId,
    },
  });

  revalideTout();
  redirectWithFlash(retour, "Commentaire publié");
}

/* ============================ Ressources ============================ */

export async function createResource(formData: FormData) {
  const type = texte(formData, "type") === "payant" ? "payant" : "gratuit";
  const r = await prisma.resource.create({
    data: {
      titre: texte(formData, "titre") || "Nouvelle ressource",
      cat: RESOURCE_CAT_DB[(texte(formData, "cat") || "Guide") as ResourceCategory],
      fmt:
        texte(formData, "fmt") === "Vidéo"
          ? "video"
          : texte(formData, "fmt") === "DOCX"
            ? "docx"
            : "pdf",
      taille: texte(formData, "taille") || "—",
      date: new Date(),
      type,
      prix: type === "payant" ? Number(formData.get("prix")) || 0 : 0,
    },
  });
  revalideTout();
  redirectWithFlash("/admin/ressources", `« ${r.titre} » ajoutée à la bibliothèque`);
}

export async function deleteResource(formData: FormData) {
  const id = texte(formData, "resourceId");
  const r = await prisma.resource.findUnique({ where: { id }, select: { titre: true } });
  await prisma.resource.delete({ where: { id } });
  revalideTout();
  redirectWithFlash("/admin/ressources", `« ${r?.titre} » retirée`);
}

/**
 * Téléchargement d'une ressource.
 *
 * Aucun fichier n'est encore stocké : l'action consigne la demande et le dira
 * franchement, plutôt que de faire semblant de servir un document.
 */
export async function downloadResource(formData: FormData) {
  const id = texte(formData, "resourceId");
  const space = (texte(formData, "space") || "membre") as Space;
  const r = await prisma.resource.findUnique({ where: { id } });
  if (!r) redirectWithFlash(`/${space}/ressources`, "Ressource introuvable.");

  const user = await getCurrentUser(space);
  await prisma.auditLog.create({
    data: {
      action: r.type === "payant" ? "ressource_achetee" : "ressource_telechargee",
      entite: "Resource",
      entiteId: id,
      acteur: user.nom,
      detail: r.titre,
    },
  });

  revalideTout();
  redirectWithFlash(
    `/${space}/ressources`,
    r.type === "payant"
      ? `Demande d’achat consignée pour « ${r.titre} » — le paiement en ligne n’est pas branché`
      : `Demande consignée pour « ${r.titre} » — aucun fichier n’est encore stocké`,
  );
}

/* ============================ Offres & services ============================ */

export async function createOffer(formData: FormData) {
  const titre = texte(formData, "titre");
  const memberId = texte(formData, "memberId");
  if (!titre) redirectWithFlash("/admin/actualites", "Le titre de l’offre est requis.");

  await prisma.offer.create({
    data: { titre, desc: texte(formData, "desc") || "Détails à venir.", memberId },
  });
  revalideTout();
  redirectWithFlash("/admin/actualites", "Offre publiée dans les actualités");
}

export async function deleteOffer(formData: FormData) {
  await prisma.offer.delete({ where: { id: texte(formData, "offerId") } });
  revalideTout();
  redirectWithFlash("/admin/actualites", "Offre retirée");
}

export async function saveService(formData: FormData) {
  const id = texte(formData, "serviceId");
  const type = texte(formData, "type") === "payant" ? "payant" : "gratuit";
  const data = {
    titre: texte(formData, "titre") || "Nouveau service",
    desc: texte(formData, "desc") || "Détails à venir.",
    type,
    prix: type === "payant" ? Number(formData.get("prix")) || 0 : 0,
  } as const;

  if (id) {
    await prisma.canchamService.update({ where: { id }, data });
  } else {
    const n = await prisma.canchamService.count();
    await prisma.canchamService.create({ data: { ...data, icon: "award", ordre: n } });
  }

  revalideTout();
  redirectWithFlash(
    "/admin/offres-cancham",
    id ? "Service mis à jour" : "Service publié auprès des membres",
  );
}

export async function deleteService(formData: FormData) {
  await prisma.canchamService.delete({ where: { id: texte(formData, "serviceId") } });
  revalideTout();
  redirectWithFlash("/admin/offres-cancham", "Service retiré");
}
