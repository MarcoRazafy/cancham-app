"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import {
  ETAPES_ACCUEIL,
  NOMBRE_ETAPES,
  PAYS,
  PROVISOIRE,
  numeroComplet,
  telephoneValide,
} from "@/lib/accueil";
import { COURRIEL_EQUIPE, envoyerCourriel, urlPublique } from "@/lib/courriel";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { jourBase } from "@/lib/format";
import { minutes, origineAppelante, tentative } from "@/lib/limite";
import { normaliserSite } from "@/lib/liens";
import { estSecteur, secteurOuProvisoire } from "@/lib/secteurs";
import {
  courrielDemandeRecue,
  courrielNouvelleInscription,
} from "@/lib/modeles-courriels";
import { creerProduit } from "@/lib/produits";
import { FORMULES } from "@/lib/membership";
import { getCurrentUser } from "@/lib/session";
import { enregistrerImage, ImageRefusee } from "@/lib/uploads";

/**
 * Adhésion en deux temps : la candidature d'abord, avec la fiche de la
 * chambre ; puis, une fois validée par l'équipe, la suite de la présentation,
 * étape par étape (`/bienvenue`).
 *
 * Chaque étape enregistre ce qu'elle a reçu et passe à la suivante ; une
 * étape passée ne touche à rien. La fiche porte des valeurs provisoires
 * (`PROVISOIRE`) tant que le membre ne les a pas remplacées.
 */

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

const INSCRIPTION = "/auth/inscription";

/** Pages publiques d'où l'on dépose une candidature — et où l'on revient en cas d'erreur. */
const FORMULAIRES = [INSCRIPTION, "/public"];

/** Candidatures déposées depuis une même origine en une heure. */
const CANDIDATURES_PAR_HEURE = 5;

/**
 * Dépôt d'une candidature, depuis la page d'inscription ou la vitrine.
 *
 * Les champs reprennent la fiche d'inscription de la chambre, sans mot de
 * passe : le compte est créé sans, et c'est l'équipe qui ouvre l'accès en
 * validant la demande (« Accéder »). Le contact reçoit alors un lien pour
 * créer son mot de passe. On revient à la page de connexion, qui l'explique.
 */
export async function deposerCandidature(formData: FormData) {
  const retourSaisi = texte(formData, "retour");
  const retour = FORMULAIRES.includes(retourSaisi) ? retourSaisi : INSCRIPTION;

  // Une même origine ne dépose pas des candidatures à la chaîne.
  const attente = tentative(
    `candidature:${await origineAppelante()}`,
    CANDIDATURES_PAR_HEURE,
    60 * 60 * 1000,
  );
  if (attente) {
    redirectWithErreur(
      retour,
      `Trop de demandes depuis cet appareil. Réessayez dans ${minutes(attente)} minute${minutes(attente) > 1 ? "s" : ""}.`,
    );
  }

  const prenom = texte(formData, "prenomRep").slice(0, 60);
  const nomFamille = texte(formData, "nomRep").slice(0, 60);
  const rep = [prenom, nomFamille].filter(Boolean).join(" ");
  const email = texte(formData, "email").toLowerCase();
  const tel = numeroComplet(
    texte(formData, "indicatif"),
    texte(formData, "tel"),
  );
  const ville = texte(formData, "ville").slice(0, 80);
  const paysSaisi = texte(formData, "pays");
  const pays = (PAYS as readonly string[]).includes(paysSaisi)
    ? paysSaisi
    : "Madagascar";
  // « Mettre N/A si pas d'entreprise » : la fiche de la chambre distingue
  // ainsi l'indépendant de l'entreprise. La fiche porte alors son nom.
  const nomSaisi = texte(formData, "nom").slice(0, 120);
  const independant = !nomSaisi || /^n\s*\/?\s*a$/i.test(nomSaisi);
  const motivation = texte(formData, "motivation").slice(0, 1000);
  const formuleSaisie = texte(formData, "formule");

  const erreur = (message: string): never =>
    redirectWithErreur(retour, message);
  if (!prenom || !nomFamille) erreur("Indiquez votre nom et votre prénom.");
  if (!email.includes("@")) erreur("Indiquez une adresse courriel valide.");
  if (!tel) erreur("Indiquez votre numéro de téléphone.");
  if (!telephoneValide(tel)) {
    erreur(`« ${tel} » n’est pas un numéro de téléphone valide.`);
  }
  if (!ville) erreur("Indiquez votre ville.");
  if (!motivation) {
    erreur(
      "Dites-nous en quelques mots pourquoi vous souhaitez rejoindre CanCham.",
    );
  }
  if (
    await prisma.user.findUnique({ where: { email }, select: { id: true } })
  ) {
    erreur("Cette adresse a déjà un compte : connectez-vous.");
  }

  const entreprise = independant ? rep : nomSaisi;
  const membre = await prisma.member.create({
    data: {
      type: independant ? "physique" : "morale",
      nom: entreprise,
      secteur: secteurOuProvisoire(
        texte(formData, "secteur"),
        PROVISOIRE.secteur,
      ),
      ville,
      pays,
      statut: "candidature",
      ...(formuleSaisie in FORMULES
        ? { formule: formuleSaisie as keyof typeof FORMULES }
        : {}),
      adhesion: jourBase(),
      activite: PROVISOIRE.activite,
      desc: PROVISOIRE.desc,
      motivation,
      accueilEnCours: true,
    },
  });

  // La personne qui dépose la demande devient le contact principal : c'est
  // elle que la chambre appellera, et le compte avec lequel elle se
  // connectera. Sans mot de passe : il se crée par le lien que l'équipe
  // envoie en cliquant sur « Accéder ».
  await prisma.user.create({
    data: {
      role: "membre",
      nom: rep,
      fonction: independant ? "Indépendant(e)" : PROVISOIRE.fonction,
      email,
      tel,
      memberId: membre.id,
      contactPrincipal: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "candidature_deposee",
      entite: "Member",
      entiteId: membre.id,
      acteur: rep,
      detail: `Demande de ${entreprise} (${email}).`,
    },
  });

  // Les e-mails partent après la réponse : la demande n'attend pas le
  // service d'envoi, et ne dépend pas de lui.
  const fiche = await urlPublique(`/admin/membres/${membre.id}`);
  after(() =>
    Promise.all([
      envoyerCourriel(courrielDemandeRecue(email, rep)),
      envoyerCourriel(
        courrielNouvelleInscription(
          COURRIEL_EQUIPE,
          email,
          [
            `${rep} · ${independant ? "indépendant(e)" : entreprise}`,
            `Téléphone : ${tel}`,
            `${ville}, ${pays}`,
            `Sa motivation : « ${motivation} »`,
          ],
          fiche,
        ),
      ),
    ]),
  );

  revalidatePath("/", "layout");
  // Retour à la connexion, qui explique que la demande est à l'examen.
  redirect(`/auth?${new URLSearchParams({ demande: "1", email })}`);
}

/** Enregistre une étape de la présentation, puis passe à la suivante. */
export async function enregistrerEtape(formData: FormData) {
  const user = await getCurrentUser("membre");
  if (!user.memberId) redirect("/membre/profil");
  const memberId = user.memberId;

  const numero = Number(texte(formData, "etape"));
  const etape = ETAPES_ACCUEIL[numero - 1]?.cle;
  const ici = `/bienvenue?etape=${numero}`;

  switch (etape) {
    case "vous": {
      const nom = [texte(formData, "prenom"), texte(formData, "nom")]
        .filter(Boolean)
        .join(" ");
      if (!nom) {
        redirectWithErreur(
          ici,
          "Indiquez votre prénom et votre nom, ou passez l’étape.",
        );
      }
      const tel = texte(formData, "tel");
      if (tel && !telephoneValide(tel)) {
        redirectWithErreur(
          ici,
          `« ${tel} » n’est pas un numéro de téléphone valide.`,
        );
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          nom,
          fonction: texte(formData, "fonction") || PROVISOIRE.fonction,
          tel: tel || null,
        },
      });
      break;
    }

    case "entreprise": {
      const type =
        texte(formData, "type") === "physique" ? "physique" : "morale";
      // Un indépendant n'a pas d'entreprise : sa fiche porte son nom.
      const nom =
        texte(formData, "nom") || (type === "physique" ? user.nom : "");
      if (!nom) {
        redirectWithErreur(
          ici,
          "Indiquez le nom de votre entreprise, ou passez l’étape.",
        );
      }
      const siteSaisi = texte(formData, "siteweb");
      const siteweb = normaliserSite(siteSaisi);
      if (siteSaisi && !siteweb) {
        redirectWithErreur(
          ici,
          `« ${siteSaisi} » n’est pas une adresse de site valide.`,
        );
      }
      await prisma.member.update({
        where: { id: memberId },
        data: {
          type,
          nom,
          // Rien de choisi : la valeur provisoire. Hors de la liste (ancien
          // libellé renvoyé tel quel, ou valeur fabriquée) : inchangé.
          secteur: !texte(formData, "secteur")
            ? PROVISOIRE.secteur
            : estSecteur(texte(formData, "secteur"))
              ? texte(formData, "secteur")
              : undefined,
          ville: texte(formData, "ville") || PROVISOIRE.ville,
          statutJuridique: texte(formData, "statutJuridique") || null,
          pays: texte(formData, "pays") || null,
          siteweb,
        },
      });
      break;
    }

    case "formule": {
      const formule = texte(formData, "formule");
      await prisma.member.update({
        where: { id: memberId },
        data: {
          ...(formule in FORMULES
            ? { formule: formule as keyof typeof FORMULES }
            : {}),
          motivation: texte(formData, "motivation").slice(0, 1000) || null,
        },
      });
      break;
    }

    case "activite": {
      await prisma.member.update({
        where: { id: memberId },
        data: {
          activite: texte(formData, "activite") || PROVISOIRE.activite,
          desc: texte(formData, "desc") || PROVISOIRE.desc,
          besoins: texte(formData, "besoins") || null,
        },
      });
      break;
    }

    case "visuels": {
      let logo: string | null = null;
      let cover: string | null = null;
      try {
        logo = await enregistrerImage(formData.get("logo"), {
          prefixe: `logo-${memberId}`,
          largeur: 600,
          transparence: true,
        });
        cover = await enregistrerImage(formData.get("cover"), {
          prefixe: `couverture-${memberId}`,
          largeur: 1600,
        });
      } catch (e) {
        if (e instanceof ImageRefusee) redirectWithErreur(ici, e.message);
        throw e;
      }
      // Sans nouveau fichier, l'image en place reste.
      if (logo || cover) {
        await prisma.member.update({
          where: { id: memberId },
          data: { ...(logo ? { logo } : {}), ...(cover ? { cover } : {}) },
        });
      }
      break;
    }

    case "produits": {
      // Une offre à la fois ; « Ajouter et continuer » revient ici pour la
      // suivante, « Terminer » enregistre la dernière et clôt l'accueil.
      let ajoute: string | null = null;
      try {
        ajoute = await creerProduit(formData, memberId);
      } catch (e) {
        if (e instanceof ImageRefusee) redirectWithErreur(ici, e.message);
        throw e;
      }
      if (texte(formData, "encore") === "1") {
        revalidatePath("/", "layout");
        if (!ajoute) {
          redirectWithErreur(ici, "Donnez au moins un titre à votre offre.");
        }
        redirectWithFlash(ici, `« ${ajoute} » ajouté à votre catalogue`);
      }
      break;
    }

    default:
      redirect("/bienvenue");
  }

  revalidatePath("/", "layout");
  if (numero < NOMBRE_ETAPES) redirect(`/bienvenue?etape=${numero + 1}`);
  await terminer(memberId, user.id);
}

/** « Terminer » sans rien enregistrer : la dernière étape passée. */
export async function terminerAccueil() {
  const user = await getCurrentUser("membre");
  if (!user.memberId) redirect("/membre/profil");
  await terminer(user.memberId, user.id);
}

async function terminer(memberId: string, userId: string): Promise<never> {
  await prisma.member.update({
    where: { id: memberId },
    data: { accueilEnCours: false },
  });
  const { nom } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { nom: true },
  });
  revalidatePath("/", "layout");
  redirectWithFlash(
    "/membre/profil",
    `Bienvenue ${nom.split(" ")[0]} · votre inscription est terminée`,
  );
}
