"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { RESOURCE_CAT_DB } from "@/lib/enums";
import { redirectWithFlash } from "@/lib/flash";
import { getCurrentUser } from "@/lib/session";
import { ImageRefusee, enregistrerImage } from "@/lib/uploads";
import type { NewsCategory, ResourceCategory, Space } from "@/lib/types";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const revalideTout = () => revalidatePath("/", "layout");

const NEWS_CAT_DB: Record<
  NewsCategory,
  "programmation" | "evenement_passe" | "vie_de_la_chambre" | "formation"
> = {
  Programmation: "programmation",
  "Événement passé": "evenement_passe",
  "Vie de la chambre": "vie_de_la_chambre",
  Formation: "formation",
};

/* ============================ Actualités ============================ */

/** La personne de l'équipe qui agit, nommée dans le journal. */
async function acteurEquipe(): Promise<string> {
  return (await getCurrentUser("admin")).nom;
}

async function journal(
  action: string,
  entite: string,
  entiteId: string,
  detail: string,
) {
  await prisma.auditLog.create({
    data: { action, entite, entiteId, acteur: await acteurEquipe(), detail },
  });
}

/**
 * Publication ou modification d'une actualité.
 *
 * Sans photo, la publication garde son bandeau de couleur : le fil reste
 * lisible même quand l'équipe n'a pas d'image sous la main.
 */
export async function enregistrerActualite(formData: FormData) {
  const id = texte(formData, "newsId");
  const retour = id
    ? `/admin/actualites/${id}/modifier`
    : "/admin/actualites/nouvelle";

  const titre = texte(formData, "titre");
  const extrait = texte(formData, "extrait");
  const corps = texte(formData, "corps");
  if (!titre || !extrait || !corps) {
    redirectWithFlash(retour, "Titre, résumé et texte sont obligatoires.");
  }

  const cat = NEWS_CAT_DB[texte(formData, "cat") as NewsCategory];
  if (!cat) redirectWithFlash(retour, "Catégorie inconnue.");

  const jour = texte(formData, "date");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(jour)
    ? new Date(`${jour}T00:00:00`)
    : new Date();

  let image: string | null = null;
  try {
    image = await enregistrerImage(formData.get("image"), {
      prefixe: "actualite",
      largeur: 1600,
    });
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithFlash(retour, e.message);
    throw e;
  }
  const retirerImage = texte(formData, "retirerImage") === "1";

  const data = { titre, extrait, corps, cat, date };
  const n = id
    ? await prisma.news.update({
        where: { id },
        data: {
          ...data,
          ...(image ? { image } : retirerImage ? { image: null } : {}),
        },
      })
    : await prisma.news.create({
        data: {
          ...data,
          image,
          mediaType: "image",
          mediaTheme: Math.random() > 0.5 ? "navy" : "green",
        },
      });

  await journal(
    id ? "actualite_modifiee" : "actualite_publiee",
    "News",
    n.id,
    `« ${n.titre} »`,
  );
  revalideTout();
  redirectWithFlash(
    `/admin/actualites/${n.id}`,
    id ? "Actualité mise à jour" : "Actualité publiée",
  );
}

export async function deleteNews(formData: FormData) {
  const id = texte(formData, "newsId");
  const n = await prisma.news.findUnique({
    where: { id },
    select: { titre: true, _count: { select: { commentaires: true } } },
  });
  if (!n) redirectWithFlash("/admin/actualites", "Actualité introuvable.");

  await journal(
    "actualite_supprimee",
    "News",
    id,
    `« ${n.titre} » et ses ${n._count.commentaires} commentaire${n._count.commentaires > 1 ? "s" : ""}.`,
  );
  await prisma.news.delete({ where: { id } });
  revalideTout();
  redirectWithFlash("/admin/actualites", "Actualité supprimée");
}

/**
 * Retrait d'un commentaire par l'équipe : propos hors charte, doublon,
 * message privé posté en public. Le texte retiré reste lisible au journal.
 */
export async function supprimerCommentaire(formData: FormData) {
  const id = texte(formData, "commentId");
  const retour = texte(formData, "retour");
  const destination =
    retour.startsWith("/") && !retour.startsWith("//")
      ? retour
      : "/admin/actualites";

  const c = await prisma.comment.findUnique({ where: { id } });
  if (!c) redirectWithFlash(destination, "Commentaire introuvable.");

  const extrait = c.texte.length > 120 ? `${c.texte.slice(0, 117)}…` : c.texte;
  await journal(
    "commentaire_supprime",
    c.newsId ? "News" : "Resource",
    c.newsId ?? c.resourceId ?? id,
    `${c.auteur} (${c.entreprise}) : « ${extrait} »`,
  );
  await prisma.comment.delete({ where: { id } });
  revalideTout();
  redirectWithFlash(destination, "Commentaire retiré");
}

/* ============================ Commentaires ============================ */

/** Commentaire sur une actualité ou une ressource. */
/**
 * Aime ou n'aime plus une publication.
 *
 * Pas de redirection : l'action rafraîchit la page en place. Rediriger
 * renverrait le lecteur en haut du fil à chaque clic, précisément quand il est
 * en train de le parcourir.
 *
 * La contrainte d'unicité fait foi. Deux clics trop rapides peuvent tenter
 * deux insertions ; la seconde échoue sur l'index, et on l'ignore plutôt que de
 * laisser remonter une erreur pour un état déjà atteint.
 */
export async function basculerJaime(formData: FormData) {
  const newsId = texte(formData, "newsId");
  const space = (texte(formData, "space") || "membre") as Space;
  const user = await getCurrentUser(space);

  const existant = await prisma.newsLike.findUnique({
    where: { newsId_userId: { newsId, userId: user.id } },
  });

  if (existant) {
    await prisma.newsLike.deleteMany({ where: { id: existant.id } });
  } else {
    try {
      await prisma.newsLike.create({ data: { newsId, userId: user.id } });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }

  revalideTout();
}

export async function postComment(formData: FormData) {
  const texteCommentaire = texte(formData, "texte");
  const space = (texte(formData, "space") || "membre") as Space;
  const retour = texte(formData, "retour") || `/${space}/actualites`;

  if (!texteCommentaire) {
    redirectWithFlash(retour, "Le commentaire est vide.");
  }

  const user = await getCurrentUser(space);
  const entreprise = user.memberId
    ? ((
        await prisma.member.findUnique({
          where: { id: user.memberId },
          select: { nom: true },
        })
      )?.nom ?? "—")
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
      cat: RESOURCE_CAT_DB[
        (texte(formData, "cat") || "Guide") as ResourceCategory
      ],
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
  redirectWithFlash(
    "/admin/ressources",
    `« ${r.titre} » ajoutée à la bibliothèque`,
  );
}

export async function deleteResource(formData: FormData) {
  const id = texte(formData, "resourceId");
  const r = await prisma.resource.findUnique({
    where: { id },
    select: { titre: true },
  });
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
      action: "ressource_achetee",
      entite: "Resource",
      entiteId: id,
      acteur: user.nom,
      detail: r.titre,
    },
  });

  revalideTout();
  redirectWithFlash(
    `/${space}/ressources`,
    `Demande d’achat consignée pour « ${r.titre} » — le paiement en ligne n’est pas branché`,
  );
}

/* ============================ Offres & services ============================ */

/** Offre ou promotion publiée au nom d'un membre, créée ou modifiée. */
export async function enregistrerOffre(formData: FormData) {
  const id = texte(formData, "offerId");
  const titre = texte(formData, "titre");
  const desc = texte(formData, "desc");
  const memberId = texte(formData, "memberId");
  const retour = "/admin/actualites?vue=offres";

  if (!titre || !desc) {
    redirectWithFlash(retour, "Le titre et la description sont requis.");
  }
  const membre = await prisma.member.findUnique({
    where: { id: memberId },
    select: { nom: true },
  });
  if (!membre)
    redirectWithFlash(retour, "Choisissez le membre qui propose l’offre.");

  if (id) {
    await prisma.offer.update({
      where: { id },
      data: { titre, desc, memberId },
    });
  } else {
    await prisma.offer.create({ data: { titre, desc, memberId } });
  }
  revalideTout();
  redirectWithFlash(
    retour,
    id ? "Offre mise à jour" : `Offre de ${membre.nom} publiée`,
  );
}

export async function deleteOffer(formData: FormData) {
  await prisma.offer.deleteMany({ where: { id: texte(formData, "offerId") } });
  revalideTout();
  redirectWithFlash("/admin/actualites?vue=offres", "Offre retirée");
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
    await prisma.canchamService.create({
      data: { ...data, icon: "award", ordre: n },
    });
  }

  revalideTout();
  redirectWithFlash(
    "/admin/offres-cancham",
    id ? "Service mis à jour" : "Service publié auprès des membres",
  );
}

export async function deleteService(formData: FormData) {
  await prisma.canchamService.delete({
    where: { id: texte(formData, "serviceId") },
  });
  revalideTout();
  redirectWithFlash("/admin/offres-cancham", "Service retiré");
}
