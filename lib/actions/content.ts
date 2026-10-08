"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { EMPLACEMENTS_OFFRE, estEmplacementOffre } from "@/lib/offres";
import { RESOURCE_CAT_DB } from "@/lib/enums";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { jourBase, jourSaisi } from "@/lib/format";
import { estCheminFerme, normaliserLien, normaliserSite } from "@/lib/liens";
import { ADRESSE_PLATEFORME, urlPublique } from "@/lib/courriel";
import { headers } from "next/headers";
import { exigerEquipe } from "@/lib/autorisations";
import { getCurrentUser } from "@/lib/session";
import { verifierAcces } from "@/lib/acces-ressources";
import {
  FichierRefuse,
  couvertureDepuisPage,
  dupliquerRessource,
  effacerRessource,
  recevoirRessource,
  type FichierRecu,
} from "@/lib/stockage-ressources";
import { ImageRefusee, enregistrerImage } from "@/lib/uploads";
import { fichierRecu, fichiersRecus } from "@/lib/televersements";
import {
  lirePressePapier,
  poserPressePapier,
  viderPressePapier,
  type ModePressePapier,
} from "@/lib/presse-papier";
import type { NewsCategory, ResourceCategory, Space } from "@/lib/types";
import { after } from "next/server";
import { minutes, tentative } from "@/lib/limite";
import { notifierEquipe, notifierTousLesMembres } from "@/lib/push";
import { isAccessLocked } from "@/lib/membership";
import {
  extraitDePublication,
  LONGUEUR_PUBLICATION,
  PHOTOS_PAR_PUBLICATION,
  textePublication,
  titreDePublication,
  type EtatPublication,
} from "@/lib/publications";
import { getMember } from "@/lib/queries";

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

/** Une photo refusée, ou un champ de photos illisible : le message se montre. */
class PhotosRefusees extends Error {}

/**
 * Les photos d'une publication, dans l'ordre choisi : celles qu'on garde et
 * celles qui arrivent. Partagé par l'équipe et par les membres — mêmes
 * limites, même champ de formulaire. Lève `PhotosRefusees` : à chaque
 * formulaire de dire comment il montre l'erreur.
 */
async function lirePhotos(
  formData: FormData,
  actuelles: string[],
): Promise<string[]> {
  // Des fichiers, ou les jetons de leurs envois faits d'avance — dans
  // l'ordre du champ, que `ordre` désigne par rang.
  const fichiers = await fichiersRecus(formData.getAll("images"));
  let ordre: unknown;
  try {
    ordre = JSON.parse(texte(formData, "ordre") || "null") ?? [
      ...actuelles.map((u) => `e:${u}`),
      ...fichiers.map((_, i) => `n:${i}`),
    ];
  } catch {
    throw new PhotosRefusees("L’ordre des photos est illisible.");
  }
  if (!Array.isArray(ordre) || ordre.some((j) => typeof j !== "string")) {
    throw new PhotosRefusees("L’ordre des photos est illisible.");
  }
  if (ordre.length > PHOTOS_PAR_PUBLICATION) {
    throw new PhotosRefusees(
      `${PHOTOS_PAR_PUBLICATION} photos au plus par publication.`,
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
    if (e instanceof ImageRefusee) throw new PhotosRefusees(e.message);
    throw e;
  }

  // Le formulaire annonce des photos qui ne sont pas arrivées — envois
  // d'avance déjà consommés par une tentative précédente, par exemple :
  // publier sans elles passerait pour un succès.
  const annoncees = (ordre as string[]).filter((j) => j.startsWith("n:"));
  if (annoncees.length > fichiers.length) {
    throw new PhotosRefusees("Vos photos ne sont plus disponibles.");
  }

  return (ordre as string[])
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
}

/** Les photos d'un formulaire en pleine page : une erreur y ramène. */
async function photosDeLActualite(
  formData: FormData,
  actuelles: string[],
  retour: string,
): Promise<string[]> {
  try {
    return await lirePhotos(formData, actuelles);
  } catch (e) {
    if (e instanceof PhotosRefusees) redirectWithErreur(retour, e.message);
    throw e;
  }
}

/**
 * Publication ou modification d'une actualité.
 *
 * Plusieurs photos, dans l'ordre choisi : la première sert de couverture
 * dans le fil. Sans photo, la publication garde son bandeau de couleur.
 */
export async function enregistrerActualite(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "newsId");
  const retour = id
    ? `/admin/actualites/${id}/modifier`
    : "/admin/actualites/nouvelle";

  const titre = texte(formData, "titre");
  const extrait = texte(formData, "extrait");
  const corps = texte(formData, "corps");
  const avant = id
    ? await prisma.news.findUnique({
        where: { id },
        select: {
          images: true,
          libre: true,
          titre: true,
          extrait: true,
          member: { select: { nom: true } },
        },
      })
    : null;
  // Une publication libre peut n'être faite que de photos : l'équipe doit
  // pouvoir la reprendre sans lui inventer un résumé et un texte.
  if (!titre || (!avant?.libre && (!extrait || !corps))) {
    redirectWithErreur(retour, "Titre, résumé et texte sont obligatoires.");
  }

  const cat = NEWS_CAT_DB[texte(formData, "cat") as NewsCategory];
  if (!cat) redirectWithErreur(retour, "Catégorie inconnue.");

  const jour = texte(formData, "date");
  const date = jourBase(jourSaisi(jour) ?? undefined);

  // Les photos, dans l'ordre choisi : `ordre` liste les photos gardées
  // (`e:<url>`) et les nouvelles (`n:<rang dans le champ fichier>`).
  const images = await photosDeLActualite(
    formData,
    avant?.images ?? [],
    retour,
  );
  if (!corps && !images.length) {
    redirectWithErreur(retour, "Il faut un texte, ou au moins une photo.");
  }

  // Une publication libre n'a pas de vrai titre : le sien est tiré du
  // texte. Tant que l'équipe ne touche ni au titre ni au résumé, elle le
  // reste, et tous deux suivent le texte corrigé. Dès qu'elle lui en écrit
  // un, c'est un article : le fil affichera ce titre.
  const resteLibre =
    Boolean(avant?.libre) &&
    titre === avant?.titre &&
    extrait === avant?.extrait;

  // Sans choix explicite, réservée aux membres, comme avant que la
  // diffusion se choisisse.
  const estPublique = texte(formData, "diffusion") === "public";
  const data = {
    titre: resteLibre
      ? titreDePublication(corps, avant?.member?.nom ?? "un membre")
      : titre,
    extrait: resteLibre ? extraitDePublication(corps) : extrait,
    corps,
    cat,
    date,
    images,
    public: estPublique,
    libre: resteLibre,
  };
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
    `« ${n.titre} » · ${n.public ? "plateforme et page publique" : "plateforme uniquement"}`,
  );
  // Une nouvelle publication : tous les membres l'apprennent sur leur appareil.
  if (!id) {
    after(() =>
      notifierTousLesMembres({
        titre: "Nouvelle actualité CanCham",
        corps: n.titre,
        url: `/membre/actualites/${n.id}`,
      }),
    );
  }
  revalideTout();
  redirectWithFlash(
    `/admin/actualites/${n.id}`,
    id
      ? "Actualité mise à jour"
      : n.public
        ? "Actualité publiée sur la plateforme et la page publique"
        : "Actualité publiée sur la plateforme",
  );
}

/** Publications d'une même entreprise, en une heure. */
const PUBLICATIONS_PAR_HEURE = 5;

/**
 * Un membre publie dans le fil, au nom de son entreprise : un texte, des
 * photos, ou les deux.
 *
 * Elle paraît aussitôt dans le fil des membres, signée de l'entreprise.
 * L'équipe en est
 * prévenue : elle peut la modifier ou la supprimer, comme toute actualité.
 * Elle est réservée aux membres : la page publique reste à la chambre, et
 * seule l'équipe peut l'y diffuser. Le membre peut ensuite la reprendre ou
 * la retirer.
 *
 * Appelée depuis la fenêtre de publication, sans quitter le fil : elle rend
 * son résultat au lieu de rediriger, pour qu'une erreur n'efface pas ce que
 * le membre vient d'écrire.
 */
export async function publierPublication(
  _avant: EtatPublication,
  formData: FormData,
): Promise<EtatPublication> {
  const refus = (erreur: string, photosPerdues = false): EtatPublication => ({
    etape: "erreur",
    erreur,
    photosPerdues,
  });

  const user = await getCurrentUser("membre");
  if (!user.memberId) {
    return refus("Aucune entreprise n’est rattachée à ce compte.");
  }
  const memberId = user.memberId;
  const membre = await getMember(memberId);
  if (!membre) return refus("Entreprise introuvable.");
  // La page est déjà fermée à un membre restreint ; l'action, elle, est une
  // porte à part entière.
  if (isAccessLocked(membre)) {
    return refus("Publier est réservé aux membres à jour de cotisation.");
  }

  const corps = textePublication(formData.get("texte"));
  const avecPhotos = formData
    .getAll("images")
    .some((v) => (typeof v === "string" ? v.trim() !== "" : v.size > 0));
  if (!corps && !avecPhotos) {
    return refus("Écrivez quelques mots, ou ajoutez une photo.");
  }

  // Une même entreprise ne remplit pas le fil à elle seule.
  const attente = tentative(
    `actualite:${memberId}`,
    PUBLICATIONS_PAR_HEURE,
    60 * 60 * 1000,
  );
  if (attente) {
    return refus(
      `Trop de publications à la suite. Réessayez dans ${minutes(attente)} minute${minutes(attente) > 1 ? "s" : ""}.`,
    );
  }

  // À partir d'ici, les photos envoyées d'avance sont consommées : si la
  // publication échoue, il faudra les choisir à nouveau.
  let images: string[];
  try {
    images = await lirePhotos(formData, []);
  } catch (e) {
    if (e instanceof PhotosRefusees) return refus(e.message, true);
    throw e;
  }
  if (!corps && !images.length) {
    return refus("Écrivez quelques mots, ou ajoutez une photo.", true);
  }

  const n = await prisma.news.create({
    data: {
      titre: titreDePublication(corps, membre.nom),
      extrait: extraitDePublication(corps),
      corps,
      // La catégorie reste à l'équipe ; le fil signe la publication du nom
      // de l'entreprise, ce qui la distingue déjà.
      cat: "vie_de_la_chambre",
      date: jourBase(),
      images,
      // Réservée aux membres : la page publique reste à la chambre. Seule
      // l'équipe peut l'y diffuser, en la reprenant.
      public: false,
      libre: true,
      mediaType: "image",
      mediaTheme: Math.random() > 0.5 ? "navy" : "green",
      memberId,
      auteurNom: user.nom,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "actualite_publiee",
      entite: "News",
      entiteId: n.id,
      acteur: user.nom,
      detail: `« ${n.titre} » · publiée par ${membre.nom} · ${n.public ? "plateforme et page publique" : "plateforme uniquement"}`,
    },
  });
  after(() =>
    notifierEquipe({
      titre: "Publication d’un membre",
      corps: `${membre.nom} · ${n.titre}`,
      url: `/admin/actualites/${n.id}`,
    }),
  );

  revalideTout();
  return { etape: "publiee", id: n.id };
}

/**
 * La publication que le membre connecté a le droit de reprendre : celle de
 * son entreprise. L'identifiant reçu ne fait pas foi.
 */
async function maPublication(id: string) {
  const user = await getCurrentUser("membre");
  if (!user.memberId || !id) return null;
  const membre = await getMember(user.memberId);
  if (!membre || isAccessLocked(membre)) return null;
  const n = await prisma.news.findFirst({
    where: { id, memberId: user.memberId },
    select: {
      id: true,
      titre: true,
      corps: true,
      images: true,
      libre: true,
      public: true,
    },
  });
  return n ? { user, membre, n } : null;
}

/**
 * Le membre reprend sa publication : le texte et les photos. Comme à la
 * publication, l'action rend son résultat à la fenêtre.
 */
export async function modifierPublication(
  _avant: EtatPublication,
  formData: FormData,
): Promise<EtatPublication> {
  const refus = (erreur: string, photosPerdues = false): EtatPublication => ({
    etape: "erreur",
    erreur,
    photosPerdues,
  });
  const acces = await maPublication(texte(formData, "newsId"));
  if (!acces) return refus("Cette publication n’est pas la vôtre.");
  const { user, membre, n } = acces;

  // Un texte déjà plus long que la limite n'est pas raccourci parce qu'on
  // en change la diffusion ou une photo.
  const corps = textePublication(
    formData.get("texte"),
    Math.max(LONGUEUR_PUBLICATION, Array.from(n.corps).length),
  );
  let images: string[];
  try {
    images = await lirePhotos(formData, n.images);
  } catch (e) {
    if (e instanceof PhotosRefusees) return refus(e.message, true);
    throw e;
  }
  if (!corps && !images.length) {
    return refus("Écrivez quelques mots, ou gardez une photo.", true);
  }

  const maj = await prisma.news.update({
    where: { id: n.id },
    data: {
      corps,
      images,
      // Reprise par son auteur, elle revient aux membres seuls : si l'équipe
      // l'avait diffusée sur la page publique, c'est le texte qu'elle avait
      // lu — le nouveau n'y paraît pas sans qu'elle le rediffuse.
      public: false,
      // Une publication libre garde un titre tiré de son texte ; devenue un
      // article entre les mains de l'équipe, elle garde le titre de l'équipe.
      ...(n.libre
        ? {
            titre: titreDePublication(corps, membre.nom),
            extrait: extraitDePublication(corps),
          }
        : {}),
    },
  });
  await prisma.auditLog.create({
    data: {
      action: "actualite_modifiee",
      entite: "News",
      entiteId: maj.id,
      acteur: user.nom,
      detail: `« ${maj.titre} » · modifiée par ${membre.nom} · ${n.public ? "retirée de la page publique" : "plateforme uniquement"}`,
    },
  });
  // L'équipe l'avait diffusée au public : elle doit savoir qu'elle n'y est
  // plus, et pourquoi.
  if (n.public) {
    after(() =>
      notifierEquipe({
        titre: "Publication modifiée par son auteur",
        corps: `${membre.nom} · ${maj.titre} — retirée de la page publique, à rediffuser après relecture.`,
        url: `/admin/actualites/${maj.id}`,
      }),
    );
  }
  revalideTout();
  return { etape: "publiee", id: maj.id };
}

/** Le membre retire sa propre publication. */
export async function supprimerMaPublication(formData: FormData) {
  const acces = await maPublication(texte(formData, "newsId"));
  if (!acces) {
    redirectWithErreur(
      "/membre/actualites",
      "Cette publication n’est pas la vôtre.",
    );
  }
  const { user, membre, n } = acces;
  await prisma.auditLog.create({
    data: {
      action: "actualite_supprimee",
      entite: "News",
      entiteId: n.id,
      acteur: user.nom,
      detail: `« ${n.titre} » · retirée par ${membre.nom}.`,
    },
  });
  await prisma.news.delete({ where: { id: n.id } });
  revalideTout();
  redirectWithFlash("/membre/actualites", "Publication supprimée");
}

export async function deleteNews(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "newsId");
  const n = await prisma.news.findUnique({
    where: { id },
    select: { titre: true, _count: { select: { commentaires: true } } },
  });
  if (!n) redirectWithErreur("/admin/actualites", "Actualité introuvable.");

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
  if (!c) redirectWithErreur(retour, "Commentaire introuvable.");

  const auteur = c.userId === user.id;
  if (!auteur && space !== "admin") {
    redirectWithErreur(
      retour,
      "Vous ne pouvez supprimer que vos commentaires.",
    );
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
    redirectWithErreur(retour, "Le commentaire est vide.");
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
      date: jourBase(),
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
    redirectWithErreur(retour, "Vous ne pouvez modifier que vos commentaires.");
  }
  if (!nouveau) redirectWithErreur(retour, "Le commentaire est vide.");
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
  await exigerEquipe();
  const id = texte(formData, "resourceId");
  const retour = id
    ? `/admin/ressources/${id}/modifier`
    : "/admin/ressources/nouvelle";

  const titre = texte(formData, "titre");
  const description = texte(formData, "description").slice(0, 600) || null;
  const cat = RESOURCE_CAT_DB[texte(formData, "cat") as ResourceCategory];
  const type = texte(formData, "type") === "payant" ? "payant" : "gratuit";
  const prix = type === "payant" ? Math.round(Number(formData.get("prix"))) : 0;
  const fichier = await fichierRecu(formData.get("fichier"));
  // Le dossier où la ranger. Vide = à la racine de la bibliothèque.
  const dossierId = texte(formData, "dossier") || null;

  if (!titre) redirectWithErreur(retour, "Le titre est obligatoire.");
  if (!cat) redirectWithErreur(retour, "Catégorie inconnue.");
  if (type === "payant" && (!Number.isFinite(prix) || prix <= 0)) {
    redirectWithErreur(retour, "Indiquez le prix d’une ressource payante.");
  }
  if (!id && !fichier) {
    redirectWithErreur(retour, "Joignez le fichier de la ressource.");
  }
  if (dossierId) {
    const existe = await prisma.dossierRessource.count({
      where: { id: dossierId },
    });
    if (!existe) redirectWithErreur(retour, "Ce dossier n’existe plus.");
  }

  // La ligne d'abord : son identifiant nomme le dossier du fichier.
  const r = id
    ? await prisma.resource.update({
        where: { id },
        data: { titre, description, cat, type, prix, dossierId },
      })
    : await prisma.resource.create({
        data: {
          titre,
          description,
          cat,
          type,
          prix,
          dossierId,
          fmt: "pdf",
          taille: "—",
          date: jourBase(),
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
          cover: await couvertureDuContenu(r.id, recu.fmt, formData),
        },
      });
    } catch (e) {
      if (!(e instanceof FichierRefuse)) throw e;
      // Une ressource neuve sans fichier lisible n'a pas lieu d'exister.
      if (!id) {
        await prisma.resource.delete({ where: { id: r.id } });
        redirectWithErreur("/admin/ressources/nouvelle", e.message);
      }
      await prisma.resource.update({
        where: { id: r.id },
        data: { fichier: null, pages: null },
      });
      redirectWithErreur(retour, e.message);
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

/**
 * « Terminer », en fin de lecture : le membre dit qu'il a fini cette étape.
 * La vue de son dossier la coche et avance sa progression, et c'est là
 * qu'il revient.
 *
 * L'identifiant reçu ne fait pas foi : on ne note que ce que la personne a
 * vraiment le droit de lire. L'équipe n'a pas de progression à tenir.
 */
export async function terminerRessource(formData: FormData) {
  const resourceId = texte(formData, "resourceId");
  const user = await getCurrentUser("membre");
  if (!(await verifierAcces(resourceId)).ok) {
    redirectWithErreur("/membre/ressources", "Ressource introuvable.");
  }

  try {
    await prisma.lectureRessource.create({
      data: { userId: user.id, resourceId },
    });
  } catch (e) {
    // Déjà terminée : un second clic ne change rien.
    if ((e as { code?: string }).code !== "P2002") throw e;
  }

  const r = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { dossierId: true },
  });
  revalidatePath("/membre/ressources");
  redirectWithFlash(
    r?.dossierId
      ? `/membre/ressources?dossier=${r.dossierId}`
      : "/membre/ressources",
    "Étape terminée",
  );
}

/**
 * La couverture d'une ressource, tirée de son contenu.
 *
 * Plus d'image choisie à part : la carte montre ce qu'on va lire. Pour un
 * document ou une photo, la première page, rendue côté serveur. Pour une
 * vidéo, une image prise dans le film par le navigateur de l'équipe au
 * moment du choix du fichier — le serveur n'a pas de quoi décoder une
 * vidéo. Si le navigateur n'a pas pu la prendre, la carte garde son motif.
 */
async function couvertureDuContenu(
  id: string,
  fmt: FichierRecu["fmt"],
  formData: FormData,
): Promise<string | null> {
  try {
    const source =
      fmt === "video"
        ? formData.get("couvertureVideo")
        : new File(
            [new Uint8Array(await couvertureDepuisPage(id))],
            "couverture.jpg",
            {
              type: "image/jpeg",
            },
          );
    return await enregistrerImage(source, {
      prefixe: `ressource-${id}`,
      largeur: 800,
    });
  } catch (e) {
    // Une couverture ratée ne doit pas faire échouer le dépôt : le fichier,
    // lui, est bien là.
    if (e instanceof ImageRefusee) return null;
    throw e;
  }
}

export async function deleteResource(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "resourceId");
  const r = await prisma.resource.findUnique({
    where: { id },
    select: { titre: true },
  });
  if (!r) redirectWithErreur("/admin/ressources", "Ressource introuvable.");

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
  if (!r) redirectWithErreur(`/${space}/ressources`, "Ressource introuvable.");

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
  await exigerEquipe();
  const id = texte(formData, "offerId");
  const titre = texte(formData, "titre");
  const desc = texte(formData, "desc");
  const memberId = texte(formData, "memberId");
  const retour = "/admin/actualites";

  if (!titre || !desc) {
    redirectWithErreur(retour, "Le titre et la description sont requis.");
  }
  // Le lien du bouton « En profiter ». Il reste facultatif : sans lui, la
  // fenêtre de l'offre s'arrête aux coordonnées de l'entreprise.
  const saisieLien = texte(formData, "lien");
  const lien = saisieLien ? normaliserSite(saisieLien) : null;
  if (saisieLien && !lien) {
    redirectWithErreur(
      retour,
      "Le lien « En profiter » n’est pas une adresse web valide.",
    );
  }
  const membre = await prisma.member.findUnique({
    where: { id: memberId },
    select: { nom: true },
  });
  if (!membre)
    redirectWithErreur(retour, "Choisissez le membre qui propose l’offre.");

  // Où l'offre s'affiche. Sans choix lisible, aux deux endroits : c'était
  // la règle avant que cela se choisisse.
  const saisieEmplacement = texte(formData, "emplacement");
  const emplacement = estEmplacementOffre(saisieEmplacement)
    ? saisieEmplacement
    : "partout";

  let image: string | null = null;
  try {
    image = await enregistrerImage(formData.get("image"), {
      prefixe: "offre",
      largeur: 1200,
    });
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithErreur(retour, e.message);
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
        lien,
        emplacement,
        ...(image ? { image } : retirerImage ? { image: null } : {}),
      },
    });
  } else {
    await prisma.offer.create({
      data: { titre, desc, memberId, lien, image, emplacement },
    });
  }
  revalideTout();
  redirectWithFlash(
    retour,
    `${id ? "Offre mise à jour" : `Offre de ${membre.nom} publiée`} · affichée : ${EMPLACEMENTS_OFFRE[emplacement].toLowerCase()}`,
  );
}

export async function deleteOffer(formData: FormData) {
  await exigerEquipe();
  await prisma.offer.deleteMany({ where: { id: texte(formData, "offerId") } });
  revalideTout();
  redirectWithFlash("/admin/actualites", "Offre retirée");
}

/**
 * Les adresses sous lesquelles la plateforme se présente : celle des liens
 * qu'elle envoie, celle de la production, et l'hôte de la requête en cours.
 * Un lien collé qui y mène est une page d'ici, pas un site tiers.
 */
async function originesPlateforme(): Promise<string[]> {
  const hote = (await headers()).get("host");
  return [
    await urlPublique("/"),
    ADRESSE_PLATEFORME,
    ...(hote ? [`https://${hote}`] : []),
  ];
}

export async function saveService(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "serviceId");
  const type = texte(formData, "type") === "payant" ? "payant" : "gratuit";
  const titre = texte(formData, "titre");
  const desc = texte(formData, "desc");
  const prix = type === "payant" ? Math.round(Number(formData.get("prix"))) : 0;
  const retour = "/admin/offres-cancham";

  if (!titre || !desc) {
    redirectWithErreur(retour, "Le titre et la description sont requis.");
  }
  if (type === "payant" && (!Number.isFinite(prix) || prix <= 0)) {
    redirectWithErreur(retour, "Indiquez le tarif d’un service payant.");
  }

  // Le lien est facultatif. Celui d'une page de la plateforme — un
  // rendez-vous, par exemple — est rangé en chemin : il s'ouvre sur place.
  const lienSaisi = texte(formData, "lien");
  const lien = lienSaisi
    ? normaliserLien(lienSaisi, await originesPlateforme())
    : null;
  if (lienSaisi && !lien) {
    redirectWithErreur(
      retour,
      `« ${lienSaisi.slice(0, 80)} » n’est pas un lien valide.`,
    );
  }
  if (lien && estCheminFerme(lien)) {
    redirectWithErreur(
      retour,
      "Ce lien mène à l’espace de l’équipe : les membres ne peuvent pas l’ouvrir. Copiez plutôt le lien du rendez-vous.",
    );
  }

  // Un champ laissé vide garde la photo actuelle ; la case « retirer »
  // revient au dégradé.
  let image: string | null = null;
  try {
    image = await enregistrerImage(formData.get("image"), {
      prefixe: "service",
      largeur: 1200,
    });
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithErreur(retour, e.message);
    throw e;
  }
  const retirerImage = texte(formData, "retirerImage") === "1";

  const data = {
    titre,
    desc,
    type,
    prix,
    lien,
    ...(image ? { image } : retirerImage ? { image: null } : {}),
  } as const;
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
    `« ${titre} » · ${type === "payant" ? `${prix.toLocaleString("fr-FR")} Ar` : "inclus"}${lien ? ` · lien : ${lien}` : ""}.`,
  );
  revalideTout();
  redirectWithFlash(
    retour,
    id ? "Service mis à jour" : "Service publié auprès des membres",
  );
}

export async function deleteService(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "serviceId");
  const s = await prisma.canchamService.findUnique({
    where: { id },
    select: { titre: true },
  });
  if (!s) redirectWithErreur("/admin/offres-cancham", "Service introuvable.");

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
  await exigerEquipe();
  const id = texte(formData, "serviceId");
  const sens = texte(formData, "sens") === "haut" ? -1 : 1;
  const retour = "/admin/offres-cancham";

  const courant = await prisma.canchamService.findUnique({ where: { id } });
  if (!courant) redirectWithErreur(retour, "Service introuvable.");

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

/* ==================== Dossiers de la bibliothèque ==================== */

/** Un nom de dossier tient sur une carte. */
const NOM_DOSSIER_MAX = 80;

/**
 * Profondeur maximale de l'arborescence.
 *
 * Cinq niveaux suffisent à classer une bibliothèque de chambre de commerce,
 * et au-delà le fil d'Ariane ne tient plus sur un écran de téléphone.
 */
const PROFONDEUR_MAX = 5;

/** Où revenir après une opération sur un dossier. */
const retourDossier = (id: string | null) =>
  id ? `/admin/ressources?dossier=${id}` : "/admin/ressources";

/** La profondeur d'un dossier : 0 à la racine. */
async function profondeurDossier(id: string | null): Promise<number> {
  let n = 0;
  let courant = id;
  while (courant && n < 20) {
    const d = await prisma.dossierRessource.findUnique({
      where: { id: courant },
      select: { parentId: true },
    });
    if (!d) break;
    courant = d.parentId;
    n++;
  }
  return n;
}

/** Vrai si `candidat` est `dossier` lui-même ou l'un de ses descendants. */
async function estDansSaDescendance(
  dossier: string,
  candidat: string | null,
): Promise<boolean> {
  let courant = candidat;
  for (let i = 0; courant && i < 20; i++) {
    if (courant === dossier) return true;
    const d = await prisma.dossierRessource.findUnique({
      where: { id: courant },
      select: { parentId: true },
    });
    if (!d) return false;
    courant = d.parentId;
  }
  return false;
}

/**
 * Ce que le formulaire dit de l'accès à un dossier : ouvert à tous les
 * membres, ou réservé aux entreprises cochées.
 */
function accesSaisi(formData: FormData) {
  const restreint = texte(formData, "acces") === "personnalise";
  const membres = restreint
    ? [...new Set(formData.getAll("membre").map(String).filter(Boolean))]
    : [];
  return { restreint, membres };
}

/**
 * La liste des entreprises d'un dossier réservé, telle que le formulaire l'a
 * cochée : celles qui n'y sont plus perdent l'accès, les nouvelles le
 * reçoivent, celles qui l'avaient le gardent tel quel. Un identifiant qui ne
 * désigne aucune entreprise est ignoré. Rend le nombre d'entreprises listées.
 *
 * Une liste vide retire tout : c'est ce qui arrive quand le dossier
 * redevient ouvert à tous.
 */
async function synchroniserAccesDossier(
  dossierId: string,
  membreIds: string[],
  ouvertPar: string,
): Promise<number> {
  const valides = (
    await prisma.member.findMany({
      where: { id: { in: membreIds } },
      select: { id: true },
    })
  ).map((m) => m.id);
  await prisma.$transaction([
    prisma.accesDossier.deleteMany({
      where: { dossierId, memberId: { notIn: valides } },
    }),
    prisma.accesDossier.createMany({
      data: valides.map((memberId) => ({ dossierId, memberId, ouvertPar })),
      skipDuplicates: true,
    }),
  ]);
  return valides.length;
}

const ACCES_SANS_ENTREPRISE =
  "Choisissez au moins une entreprise pour un accès personnalisé.";

/**
 * Ce que le formulaire dit de la présentation d'un dossier : sa couverture,
 * et qui l'a conçu. Les images reçues sont enregistrées ici ; un champ image
 * laissé vide garde celle qui est en place, et la retirer se coche.
 *
 * Lève `ImageRefusee` quand un fichier n'est pas une image lisible.
 */
async function presentationSaisie(formData: FormData) {
  const cover = await enregistrerImage(formData.get("cover"), {
    prefixe: "dossier",
    largeur: 1280,
  });
  const photo = await enregistrerImage(formData.get("auteurPhoto"), {
    prefixe: "auteur",
    largeur: 400,
  });
  const auteurNom = texte(formData, "auteurNom").slice(0, 120) || null;
  return {
    cover,
    retirerCover: texte(formData, "retirerCover") === "1",
    photo,
    retirerPhoto: texte(formData, "retirerAuteurPhoto") === "1",
    auteurNom,
    // Sans nom, il n'y a pas d'auteur à présenter : le reste ne se garde pas.
    auteurRole: auteurNom
      ? texte(formData, "auteurRole").slice(0, 160) || null
      : null,
    auteurBio: auteurNom
      ? texte(formData, "auteurBio").slice(0, 800) || null
      : null,
  };
}

export async function creerDossier(formData: FormData) {
  const equipe = await exigerEquipe();
  const parentId = texte(formData, "parent") || null;
  const retour = retourDossier(parentId);

  const nom = texte(formData, "nom");
  const { restreint, membres } = accesSaisi(formData);
  if (!nom) redirectWithErreur(retour, "Donnez un nom au dossier.");
  if (restreint && !membres.length) {
    redirectWithErreur(retour, ACCES_SANS_ENTREPRISE);
  }
  if (nom.length > NOM_DOSSIER_MAX) {
    redirectWithErreur(retour, `Le nom dépasse ${NOM_DOSSIER_MAX} caractères.`);
  }
  if (parentId) {
    const parent = await prisma.dossierRessource.count({
      where: { id: parentId },
    });
    if (!parent)
      redirectWithErreur("/admin/ressources", "Dossier introuvable.");
    if ((await profondeurDossier(parentId)) >= PROFONDEUR_MAX) {
      redirectWithErreur(
        retour,
        `On ne range pas plus loin que ${PROFONDEUR_MAX} niveaux.`,
      );
    }
  }

  let p: Awaited<ReturnType<typeof presentationSaisie>>;
  try {
    p = await presentationSaisie(formData);
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithErreur(retour, e.message);
    throw e;
  }

  const d = await prisma.dossierRessource.create({
    data: {
      nom,
      parentId,
      restreint,
      cover: p.cover,
      auteurNom: p.auteurNom,
      auteurRole: p.auteurRole,
      auteurBio: p.auteurBio,
      auteurPhoto: p.auteurNom ? p.photo : null,
    },
  });
  if (restreint) {
    const n = await synchroniserAccesDossier(d.id, membres, equipe.nom);
    await journal(
      "dossier_acces",
      "DossierRessource",
      d.id,
      `« ${nom} » · réservé à ${n} entreprise${n > 1 ? "s" : ""}`,
    );
  }
  revalideTout();
  redirectWithFlash(retour, `Dossier « ${nom} » créé`);
}

/**
 * Qui voit un dossier : tous les membres, ou les entreprises cochées.
 *
 * Un dossier réservé n'existe que pour ces entreprises, avec tout ce qu'il
 * contient — ressources et sous-dossiers.
 */
export async function reglerAccesDossier(formData: FormData) {
  const equipe = await exigerEquipe();
  const id = texte(formData, "dossierId");

  const d = await prisma.dossierRessource.findUnique({
    where: { id },
    select: { nom: true, parentId: true },
  });
  if (!d) redirectWithErreur("/admin/ressources", "Dossier introuvable.");
  const retour = retourDossier(d.parentId);

  const { restreint, membres } = accesSaisi(formData);
  if (restreint && !membres.length) {
    redirectWithErreur(retour, ACCES_SANS_ENTREPRISE);
  }

  await prisma.dossierRessource.update({ where: { id }, data: { restreint } });
  const n = await synchroniserAccesDossier(id, membres, equipe.nom);
  await journal(
    "dossier_acces",
    "DossierRessource",
    id,
    restreint
      ? `« ${d.nom} » · réservé à ${n} entreprise${n > 1 ? "s" : ""}`
      : `« ${d.nom} » · ouvert à tous les membres`,
  );
  revalideTout();
  redirectWithFlash(
    retour,
    restreint
      ? `« ${d.nom} » réservé à ${n} entreprise${n > 1 ? "s" : ""}`
      : `« ${d.nom} » ouvert à tous les membres`,
  );
}

/** Le nom d'un dossier, sa couverture et son auteur. */
export async function modifierDossier(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "dossierId");
  const nom = texte(formData, "nom");

  const d = await prisma.dossierRessource.findUnique({
    where: { id },
    select: { parentId: true },
  });
  if (!d) redirectWithErreur("/admin/ressources", "Dossier introuvable.");
  const retour = retourDossier(d.parentId);

  if (!nom) redirectWithErreur(retour, "Donnez un nom au dossier.");
  if (nom.length > NOM_DOSSIER_MAX) {
    redirectWithErreur(retour, `Le nom dépasse ${NOM_DOSSIER_MAX} caractères.`);
  }

  let p: Awaited<ReturnType<typeof presentationSaisie>>;
  try {
    p = await presentationSaisie(formData);
  } catch (e) {
    if (e instanceof ImageRefusee) redirectWithErreur(retour, e.message);
    throw e;
  }

  await prisma.dossierRessource.update({
    where: { id },
    data: {
      nom,
      ...(p.cover ? { cover: p.cover } : p.retirerCover ? { cover: null } : {}),
      auteurNom: p.auteurNom,
      auteurRole: p.auteurRole,
      auteurBio: p.auteurBio,
      // Plus d'auteur : son portrait part avec lui.
      ...(!p.auteurNom
        ? { auteurPhoto: null }
        : p.photo
          ? { auteurPhoto: p.photo }
          : p.retirerPhoto
            ? { auteurPhoto: null }
            : {}),
    },
  });
  revalideTout();
  redirectWithFlash(retour, `Dossier « ${nom} » mis à jour`);
}

/**
 * Suppression d'un dossier : ce qu'il contenait remonte d'un cran.
 *
 * Rien n'est détruit. Un classeur se jette, pas les documents qu'il range —
 * et une suppression en cascade effacerait des fichiers, des commentaires et
 * des achats sur un simple clic de rangement.
 */
export async function supprimerDossier(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "dossierId");

  const d = await prisma.dossierRessource.findUnique({
    where: { id },
    select: {
      nom: true,
      parentId: true,
      _count: { select: { enfants: true, ressources: true } },
    },
  });
  if (!d) redirectWithErreur("/admin/ressources", "Dossier introuvable.");
  const retour = retourDossier(d.parentId);

  await prisma.$transaction([
    prisma.dossierRessource.updateMany({
      where: { parentId: id },
      data: { parentId: d.parentId },
    }),
    prisma.resource.updateMany({
      where: { dossierId: id },
      data: { dossierId: d.parentId },
    }),
    prisma.dossierRessource.delete({ where: { id } }),
  ]);

  const deplaces = d._count.enfants + d._count.ressources;
  revalideTout();
  redirectWithFlash(
    retour,
    `Dossier « ${d.nom} » supprimé${deplaces ? ` · ${deplaces} élément${deplaces > 1 ? "s remontés" : " remonté"} d’un niveau` : ""}`,
  );
}

/** Déplacement d'un dossier sous un autre — ou à la racine. */
export async function deplacerDossier(formData: FormData) {
  await exigerEquipe();
  const id = texte(formData, "dossierId");
  const vers = texte(formData, "parent") || null;

  const d = await prisma.dossierRessource.findUnique({
    where: { id },
    select: { nom: true, parentId: true },
  });
  if (!d) redirectWithErreur("/admin/ressources", "Dossier introuvable.");
  const retour = retourDossier(d.parentId);

  // Un dossier ne se range pas dans lui-même ni dans l'un des siens : la
  // branche déplacée se détacherait de l'arbre et deviendrait introuvable.
  if (vers && (await estDansSaDescendance(id, vers))) {
    redirectWithErreur(
      retour,
      "Un dossier ne peut pas être rangé dans lui-même.",
    );
  }
  if (vers && (await profondeurDossier(vers)) >= PROFONDEUR_MAX) {
    redirectWithErreur(
      retour,
      `On ne range pas plus loin que ${PROFONDEUR_MAX} niveaux.`,
    );
  }

  await prisma.dossierRessource.update({
    where: { id },
    data: { parentId: vers },
  });
  revalideTout();
  redirectWithFlash(retourDossier(vers), `Dossier « ${d.nom} » déplacé`);
}

/* ==================== Presse-papier de la bibliothèque ==================== */

/** Les identifiants cochés dans la liste. */
const coches = (fd: FormData) =>
  fd.getAll("ressource").map(String).filter(Boolean);

/**
 * Où l'on était quand on a cliqué.
 *
 * `retour` l'emporte quand il est donné — depuis la fiche d'accès d'une
 * ressource, on veut revenir à la fiche, pas à la bibliothèque. Seul un
 * chemin interne est accepté : une action serveur est une adresse publique,
 * et un `retour` choisi par l'appelant ferait une redirection ouverte.
 */
const retourBibliotheque = (fd: FormData) => {
  const r = texte(fd, "retour");
  if (r.startsWith("/admin/") && !r.startsWith("//")) return r;
  const d = texte(fd, "dossier");
  return d ? `/admin/ressources?dossier=${d}` : "/admin/ressources";
};

async function mettreAuPressePapier(
  formData: FormData,
  mode: ModePressePapier,
) {
  await exigerEquipe();
  const retour = retourBibliotheque(formData);
  const ids = coches(formData);
  if (!ids.length) {
    redirectWithErreur(retour, "Cochez au moins une ressource.");
  }

  await poserPressePapier({ mode, ids });
  redirectWithFlash(
    retour,
    `${ids.length} ressource${ids.length > 1 ? "s" : ""} ${mode === "couper" ? "à déplacer" : "à copier"} · ouvrez un dossier puis « Coller ici »`,
  );
}

export async function couperRessources(formData: FormData) {
  await mettreAuPressePapier(formData, "couper");
}

export async function copierRessources(formData: FormData) {
  await mettreAuPressePapier(formData, "copier");
}

export async function annulerPressePapier(formData: FormData) {
  await exigerEquipe();
  await viderPressePapier();
  redirectWithFlash(retourBibliotheque(formData), "Presse-papier vidé");
}

/**
 * Colle le presse-papier dans le dossier ouvert.
 *
 * « Couper » range ailleurs — une ligne qui change de dossier. « Copier »
 * duplique : une nouvelle ressource, et une vraie copie des fichiers, parce
 * que deux lignes qui partageraient le même dossier de stockage se
 * détruiraient l'une l'autre à la première suppression.
 */
export async function collerRessources(formData: FormData) {
  await exigerEquipe();
  const retour = retourBibliotheque(formData);
  const presse = await lirePressePapier();
  if (!presse) redirectWithErreur(retour, "Le presse-papier est vide.");

  const dossierId = texte(formData, "dossier") || null;
  if (dossierId) {
    const existe = await prisma.dossierRessource.count({
      where: { id: dossierId },
    });
    if (!existe)
      redirectWithErreur("/admin/ressources", "Dossier introuvable.");
  }

  const sources = await prisma.resource.findMany({
    where: { id: { in: presse.ids } },
  });
  if (!sources.length) {
    await viderPressePapier();
    redirectWithErreur(retour, "Ces ressources n’existent plus.");
  }

  if (presse.mode === "couper") {
    await prisma.resource.updateMany({
      where: { id: { in: sources.map((r) => r.id) } },
      data: { dossierId },
    });
  } else {
    for (const r of sources) {
      const copie = await prisma.resource.create({
        data: {
          titre: `${r.titre} (copie)`,
          cat: r.cat,
          fmt: r.fmt,
          taille: r.taille,
          date: r.date,
          fichier: r.fichier,
          pages: r.pages,
          cover: r.cover,
          type: r.type,
          prix: r.prix,
          dossierId,
        },
      });
      await dupliquerRessource(r.id, copie.id);
    }
  }

  await viderPressePapier();
  revalideTout();
  const n = sources.length;
  redirectWithFlash(
    retour,
    `${n} ressource${n > 1 ? "s" : ""} ${presse.mode === "couper" ? "déplacée" : "copiée"}${n > 1 ? "s" : ""} ici`,
  );
}

/* ==================== Accès aux ressources payantes ==================== */

/**
 * Ouvre l'accès d'une ou plusieurs entreprises à une ou plusieurs ressources
 * payantes.
 *
 * En lot, parce que l'équipe accorde rarement un seul accès : une formation
 * s'ouvre à la douzaine d'entreprises qui l'ont suivie, d'un coup.
 *
 * Les ressources incluses dans l'adhésion sont écartées : elles n'ont pas de
 * liste, tout membre à jour les lit.
 */
export async function ouvrirAccesRessources(formData: FormData) {
  const user = await exigerEquipe();
  const retour = retourBibliotheque(formData);

  const ressources = coches(formData);
  const membres = formData.getAll("membre").map(String).filter(Boolean);
  if (!ressources.length)
    redirectWithErreur(retour, "Aucune ressource choisie.");
  if (!membres.length)
    redirectWithErreur(retour, "Choisissez au moins une entreprise.");

  const payantes = await prisma.resource.findMany({
    where: { id: { in: ressources }, type: "payant" },
    select: { id: true, titre: true },
  });
  if (!payantes.length) {
    redirectWithErreur(
      retour,
      "Ces ressources sont incluses dans l’adhésion : tout membre à jour y accède déjà.",
    );
  }

  const { count } = await prisma.accesRessource.createMany({
    data: payantes.flatMap((r) =>
      membres.map((memberId) => ({
        resourceId: r.id,
        memberId,
        ouvertPar: user.nom,
      })),
    ),
    // Un accès déjà ouvert n'est pas une erreur : on le laisse tel quel.
    skipDuplicates: true,
  });

  for (const r of payantes) {
    await journal(
      "acces_ouvert",
      "Resource",
      r.id,
      `${membres.length} entreprise${membres.length > 1 ? "s" : ""} · ${r.titre}`,
    );
  }

  revalideTout();
  redirectWithFlash(
    retour,
    count
      ? `${count} accès ouvert${count > 1 ? "s" : ""}`
      : "Ces accès étaient déjà ouverts",
  );
}

/** Retire l'accès d'une entreprise à une ressource. */
export async function retirerAccesRessource(formData: FormData) {
  await exigerEquipe();
  const resourceId = texte(formData, "resourceId");
  const memberId = texte(formData, "membreId");
  const retour = retourBibliotheque(formData);

  const acces = await prisma.accesRessource.findUnique({
    where: { resourceId_memberId: { resourceId, memberId } },
    include: {
      member: { select: { nom: true } },
      resource: { select: { titre: true } },
    },
  });
  if (!acces) redirectWithErreur(retour, "Cet accès n’existe plus.");

  await prisma.accesRessource.delete({ where: { id: acces.id } });
  await journal(
    "acces_retire",
    "Resource",
    resourceId,
    `${acces.member.nom} · ${acces.resource.titre}`,
  );
  revalideTout();
  redirectWithFlash(retour, `Accès retiré à ${acces.member.nom}`);
}

/**
 * Couper ou copier une seule ressource, depuis son menu.
 *
 * Appelée directement par le menu — sans formulaire : le menu vit à
 * l'intérieur du formulaire de sélection, et un formulaire ne s'imbrique pas
 * dans un autre.
 */
export async function mettreUneAuPressePapier(
  id: string,
  mode: ModePressePapier,
  dossier: string | null,
) {
  await exigerEquipe();
  await poserPressePapier({ mode, ids: [id] });
  redirectWithFlash(
    dossier ? `/admin/ressources?dossier=${dossier}` : "/admin/ressources",
    `Ressource ${mode === "couper" ? "à déplacer" : "à copier"} · ouvrez un dossier puis « Coller ici »`,
  );
}

/**
 * Ouvre ou retire un accès depuis la fenêtre d'une ressource.
 *
 * Appelées avec des arguments, sans formulaire : la fenêtre vit à
 * l'intérieur du formulaire de sélection de la liste, et un formulaire ne
 * s'imbrique pas dans un autre.
 *
 * Pas de redirection ni de bandeau : la page se rafraîchit sur place et la
 * fenêtre reste ouverte, ce qui permet d'ouvrir plusieurs accès à la suite.
 */
export async function ouvrirAccesPour(resourceId: string, membreIds: string[]) {
  const user = await exigerEquipe();
  if (!membreIds.length) return;

  const r = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { id: true, titre: true, type: true },
  });
  if (!r || r.type !== "payant") return;

  await prisma.accesRessource.createMany({
    data: membreIds.map((memberId) => ({
      resourceId: r.id,
      memberId,
      ouvertPar: user.nom,
    })),
    skipDuplicates: true,
  });
  await journal(
    "acces_ouvert",
    "Resource",
    r.id,
    `${membreIds.length} entreprise${membreIds.length > 1 ? "s" : ""} · ${r.titre}`,
  );
  revalideTout();
}

export async function retirerAccesPour(resourceId: string, memberId: string) {
  await exigerEquipe();
  const acces = await prisma.accesRessource.findUnique({
    where: { resourceId_memberId: { resourceId, memberId } },
    include: {
      member: { select: { nom: true } },
      resource: { select: { titre: true } },
    },
  });
  if (!acces) return;

  await prisma.accesRessource.delete({ where: { id: acces.id } });
  await journal(
    "acces_retire",
    "Resource",
    resourceId,
    `${acces.member.nom} · ${acces.resource.titre}`,
  );
  revalideTout();
}
