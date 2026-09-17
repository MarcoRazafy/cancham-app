"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { RESOURCE_CAT_DB } from "@/lib/enums";
import { redirectWithFlash } from "@/lib/flash";
import { getCurrentUser } from "@/lib/session";
import {
  FichierRefuse,
  effacerRessource,
  recevoirRessource,
} from "@/lib/stockage-ressources";
import { ImageRefusee, enregistrerImage } from "@/lib/uploads";
import type { NewsCategory, ResourceCategory, Space } from "@/lib/types";

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const revalideTout = () => revalidatePath("/", "layout");

/** Page de retour d'un formulaire : un chemin interne, jamais une adresse tierce. */
function cheminRetour(fd: FormData, defaut: string): string {
  const r = texte(fd, "retour");
  return r.startsWith("/") && !r.startsWith("//") ? r : defaut;
}

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

/** Photos d'une publication, au plus. */
const PHOTOS_PAR_ACTUALITE = 10;

/**
 * Publication ou modification d'une actualité.
 *
 * Plusieurs photos, dans l'ordre choisi : la première sert de couverture
 * dans le fil. Sans photo, la publication garde son bandeau de couleur.
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

  // Les photos, dans l'ordre choisi : `ordre` liste les photos gardées
  // (`e:<url>`) et les nouvelles (`n:<rang dans le champ fichier>`).
  const actuelles = id
    ? ((
        await prisma.news.findUnique({
          where: { id },
          select: { images: true },
        })
      )?.images ?? [])
    : [];
  const fichiers = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);
  let ordre: string[];
  try {
    ordre = JSON.parse(texte(formData, "ordre") || "null") ?? [
      ...actuelles.map((u) => `e:${u}`),
      ...fichiers.map((_, i) => `n:${i}`),
    ];
  } catch {
    redirectWithFlash(retour, "L’ordre des photos est illisible.");
  }
  if (ordre.length > PHOTOS_PAR_ACTUALITE) {
    redirectWithFlash(
      retour,
      `${PHOTOS_PAR_ACTUALITE} photos au plus par publication.`,
    );
  }

  const envoyees: (string | null)[] = [];
  try {
    for (const f of fichiers) {
      envoyees.push(
        await enregistrerImage(f, { prefixe: "actualite", largeur: 1600 }),
      );
    }
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithFlash(retour, e.message);
    throw e;
  }

  const images = ordre
    .map((jeton) =>
      jeton.startsWith("e:")
        ? actuelles.includes(jeton.slice(2))
          ? jeton.slice(2)
          : null
        : jeton.startsWith("n:")
          ? (envoyees[Number(jeton.slice(2))] ?? null)
          : null,
    )
    .filter((u): u is string => Boolean(u));

  const data = { titre, extrait, corps, cat, date, images };
  const n = id
    ? await prisma.news.update({ where: { id }, data })
    : await prisma.news.create({
        data: {
          ...data,
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
  const space = (texte(formData, "space") || "admin") as Space;
  const retour = cheminRetour(formData, `/${space}/actualites`);

  const user = await getCurrentUser(space);
  const c = await prisma.comment.findUnique({ where: { id } });
  if (!c) redirectWithFlash(retour, "Commentaire introuvable.");

  const auteur = c.userId === user.id;
  if (!auteur && space !== "admin") {
    redirectWithFlash(retour, "Vous ne pouvez supprimer que vos commentaires.");
  }

  // Seul le retrait par l'équipe du commentaire de quelqu'un d'autre est une
  // modération, et passe au journal avec le texte retiré.
  if (!auteur) {
    const extrait =
      c.texte.length > 120 ? `${c.texte.slice(0, 117)}…` : c.texte;
    await journal(
      "commentaire_supprime",
      c.newsId ? "News" : "Resource",
      c.newsId ?? c.resourceId ?? id,
      `${c.auteur} (${c.entreprise}) : « ${extrait} »`,
    );
  }
  await prisma.comment.delete({ where: { id } });
  revalideTout();
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
  const retour = cheminRetour(formData, `/${space}/actualites`);

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

  await prisma.comment.create({
    data: {
      auteur: user.nom,
      entreprise,
      texte: texteCommentaire,
      date: new Date(),
      newsId: texte(formData, "newsId") || null,
      resourceId: texte(formData, "resourceId") || null,
      userId: user.id,
    },
  });

  // Pas de redirection : la page se met à jour sur place, et le lecteur
  // reste au niveau des commentaires au lieu de repartir en haut de l'article.
  revalideTout();
}

/** Corrige son propre commentaire. Il porte ensuite la mention « modifié ». */
export async function modifierCommentaire(formData: FormData) {
  const id = texte(formData, "commentId");
  const space = (texte(formData, "space") || "membre") as Space;
  const retour = cheminRetour(formData, `/${space}/actualites`);
  const nouveau = texte(formData, "texte");

  const user = await getCurrentUser(space);
  const c = await prisma.comment.findUnique({
    where: { id },
    select: { userId: true, texte: true },
  });
  if (!c || c.userId !== user.id) {
    redirectWithFlash(retour, "Vous ne pouvez modifier que vos commentaires.");
  }
  if (!nouveau) redirectWithFlash(retour, "Le commentaire est vide.");
  if (nouveau === c.texte) return;

  await prisma.comment.update({
    where: { id },
    data: { texte: nouveau, modifieLe: new Date() },
  });
  revalideTout();
}

/** « J'aime » sur un commentaire, posé ou retiré. Même principe que pour une publication. */
export async function basculerJaimeCommentaire(formData: FormData) {
  const commentId = texte(formData, "commentId");
  const space = (texte(formData, "space") || "membre") as Space;
  const user = await getCurrentUser(space);

  const existant = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId: user.id } },
  });
  if (existant) {
    await prisma.commentLike.deleteMany({ where: { id: existant.id } });
  } else {
    try {
      await prisma.commentLike.create({
        data: { commentId, userId: user.id },
      });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  revalideTout();
}

/* ============================ Ressources ============================ */

/**
 * Ajout ou modification d'une ressource de la bibliothèque.
 *
 * Le fichier est obligatoire à la création, facultatif ensuite : sans
 * nouveau fichier, la ressource garde le sien. Il est converti sur place
 * pour la lecture protégée — les pages d'un document en images — avant que
 * la ressource ne soit annoncée prête.
 */
export async function enregistrerRessource(formData: FormData) {
  const id = texte(formData, "resourceId");
  const retour = id
    ? `/admin/ressources/${id}/modifier`
    : "/admin/ressources/nouvelle";

  const titre = texte(formData, "titre");
  const cat = RESOURCE_CAT_DB[texte(formData, "cat") as ResourceCategory];
  const type = texte(formData, "type") === "payant" ? "payant" : "gratuit";
  const prix = type === "payant" ? Math.round(Number(formData.get("prix"))) : 0;
  const entree = formData.get("fichier");
  const fichier = entree instanceof File && entree.size > 0 ? entree : null;

  if (!titre) redirectWithFlash(retour, "Le titre est obligatoire.");
  if (!cat) redirectWithFlash(retour, "Catégorie inconnue.");
  if (type === "payant" && (!Number.isFinite(prix) || prix <= 0)) {
    redirectWithFlash(retour, "Indiquez le prix d’une ressource payante.");
  }
  if (!id && !fichier) {
    redirectWithFlash(retour, "Joignez le fichier de la ressource.");
  }

  let cover: string | null = null;
  try {
    cover = await enregistrerImage(formData.get("cover"), {
      prefixe: "ressource",
      largeur: 1200,
    });
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithFlash(retour, e.message);
    throw e;
  }
  const retirerCover = texte(formData, "retirerCover") === "1";

  // La ligne d'abord : son identifiant nomme le dossier du fichier.
  const r = id
    ? await prisma.resource.update({
        where: { id },
        data: {
          titre,
          cat,
          type,
          prix,
          ...(cover ? { cover } : retirerCover ? { cover: null } : {}),
        },
      })
    : await prisma.resource.create({
        data: {
          titre,
          cat,
          type,
          prix,
          cover,
          fmt: "pdf",
          taille: "—",
          date: new Date(),
        },
      });

  if (fichier) {
    try {
      const recu = await recevoirRessource(r.id, fichier);
      await prisma.resource.update({
        where: { id: r.id },
        data: {
          fmt: recu.fmt,
          fichier: recu.fichier,
          pages: recu.pages,
          taille: recu.taille,
        },
      });
    } catch (e) {
      if (!(e instanceof FichierRefuse)) throw e;
      // Une ressource neuve sans fichier lisible n'a pas lieu d'exister.
      if (!id) {
        await prisma.resource.delete({ where: { id: r.id } });
        redirectWithFlash("/admin/ressources/nouvelle", e.message);
      }
      await prisma.resource.update({
        where: { id: r.id },
        data: { fichier: null, pages: null },
      });
      redirectWithFlash(retour, e.message);
    }
  }

  await prisma.auditLog.create({
    data: {
      action: id ? "ressource_modifiee" : "ressource_ajoutee",
      entite: "Resource",
      entiteId: r.id,
      acteur: await acteurEquipe(),
      detail: `« ${titre} »${fichier ? ` · fichier ${fichier.name}` : ""}.`,
    },
  });

  revalideTout();
  redirectWithFlash(
    "/admin/ressources",
    id ? `« ${titre} » mise à jour` : `« ${titre} » ajoutée à la bibliothèque`,
  );
}

export async function deleteResource(formData: FormData) {
  const id = texte(formData, "resourceId");
  const r = await prisma.resource.findUnique({
    where: { id },
    select: { titre: true },
  });
  if (!r) redirectWithFlash("/admin/ressources", "Ressource introuvable.");

  await prisma.auditLog.create({
    data: {
      action: "ressource_supprimee",
      entite: "Resource",
      entiteId: id,
      acteur: await acteurEquipe(),
      detail: `« ${r.titre} » et ses fichiers.`,
    },
  });
  await prisma.resource.delete({ where: { id } });
  await effacerRessource(id);
  revalideTout();
  redirectWithFlash("/admin/ressources", `« ${r.titre} » retirée`);
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
  const retour = "/admin/actualites";

  if (!titre || !desc) {
    redirectWithFlash(retour, "Le titre et la description sont requis.");
  }
  const membre = await prisma.member.findUnique({
    where: { id: memberId },
    select: { nom: true },
  });
  if (!membre)
    redirectWithFlash(retour, "Choisissez le membre qui propose l’offre.");

  let image: string | null = null;
  try {
    image = await enregistrerImage(formData.get("image"), {
      prefixe: "offre",
      largeur: 1200,
    });
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithFlash(retour, e.message);
    throw e;
  }
  const retirerImage = texte(formData, "retirerImage") === "1";

  if (id) {
    await prisma.offer.update({
      where: { id },
      data: {
        titre,
        desc,
        memberId,
        ...(image ? { image } : retirerImage ? { image: null } : {}),
      },
    });
  } else {
    await prisma.offer.create({ data: { titre, desc, memberId, image } });
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
  redirectWithFlash("/admin/actualites", "Offre retirée");
}

export async function saveService(formData: FormData) {
  const id = texte(formData, "serviceId");
  const type = texte(formData, "type") === "payant" ? "payant" : "gratuit";
  const titre = texte(formData, "titre");
  const desc = texte(formData, "desc");
  const prix = type === "payant" ? Math.round(Number(formData.get("prix"))) : 0;
  const retour = "/admin/offres-cancham";

  if (!titre || !desc) {
    redirectWithFlash(retour, "Le titre et la description sont requis.");
  }
  if (type === "payant" && (!Number.isFinite(prix) || prix <= 0)) {
    redirectWithFlash(retour, "Indiquez le tarif d’un service payant.");
  }

  const data = { titre, desc, type, prix } as const;
  const service = id
    ? await prisma.canchamService.update({ where: { id }, data })
    : await prisma.canchamService.create({
        data: {
          ...data,
          icon: "award",
          // En fin de liste : il ne passe pas devant ceux déjà présentés.
          ordre:
            ((await prisma.canchamService.aggregate({ _max: { ordre: true } }))
              ._max.ordre ?? -1) + 1,
        },
      });

  await journal(
    id ? "service_modifie" : "service_ajoute",
    "CanchamService",
    service.id,
    `« ${titre} » · ${type === "payant" ? `${prix.toLocaleString("fr-FR")} Ar` : "inclus"}.`,
  );
  revalideTout();
  redirectWithFlash(
    retour,
    id ? "Service mis à jour" : "Service publié auprès des membres",
  );
}

export async function deleteService(formData: FormData) {
  const id = texte(formData, "serviceId");
  const s = await prisma.canchamService.findUnique({
    where: { id },
    select: { titre: true },
  });
  if (!s) redirectWithFlash("/admin/offres-cancham", "Service introuvable.");

  await journal("service_supprime", "CanchamService", id, `« ${s.titre} ».`);
  await prisma.canchamService.delete({ where: { id } });
  revalideTout();
  redirectWithFlash("/admin/offres-cancham", `« ${s.titre} » retiré`);
}

/**
 * Déplace un service d'un rang dans sa liste — gratuits ou payants —, pour
 * choisir ce que les membres voient en premier.
 */
export async function deplacerService(formData: FormData) {
  const id = texte(formData, "serviceId");
  const sens = texte(formData, "sens") === "haut" ? -1 : 1;
  const retour = "/admin/offres-cancham";

  const courant = await prisma.canchamService.findUnique({ where: { id } });
  if (!courant) redirectWithFlash(retour, "Service introuvable.");

  const liste = await prisma.canchamService.findMany({
    where: { type: courant.type },
    orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const i = liste.findIndex((x) => x.id === id);
  const j = i + sens;
  if (j < 0 || j >= liste.length) redirect(retour);

  [liste[i], liste[j]] = [liste[j], liste[i]];
  // Renuméroter toute la liste : deux services au même rang rendraient
  // l'échange sans effet.
  await prisma.$transaction(
    liste.map((x, ordre) =>
      prisma.canchamService.update({ where: { id: x.id }, data: { ordre } }),
    ),
  );
  revalideTout();
  redirect(retour);
}
