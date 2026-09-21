"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { hacher, MOT_DE_PASSE_MIN } from "@/lib/auth";
import {
  ETAPES_ACCUEIL,
  NOMBRE_ETAPES,
  PROVISOIRE,
  nomDepuisCourriel,
  telephoneValide,
} from "@/lib/accueil";
import { COURRIEL_EQUIPE, envoyerCourriel, urlPublique } from "@/lib/courriel";
import { redirectWithErreur, redirectWithFlash } from "@/lib/flash";
import { jourBase } from "@/lib/format";
import { minutes, origineAppelante, tentative } from "@/lib/limite";
import { normaliserSite } from "@/lib/liens";
import { estSecteur } from "@/lib/secteurs";
import {
  courrielBienvenue,
  courrielNouvelleInscription,
} from "@/lib/modeles-courriels";
import { FORMULES } from "@/lib/membership";
import { getCurrentUser } from "@/lib/session";
import { enregistrerImage, ImageRefusee } from "@/lib/uploads";

/**
 * Inscription en deux temps : le compte d'abord, avec l'essentiel, puis la
 * présentation, étape par étape (`/bienvenue`).
 *
 * Chaque étape enregistre ce qu'elle a reçu et passe à la suivante ; une
 * étape passée ne touche à rien. La fiche porte des valeurs provisoires
 * (`PROVISOIRE`) tant que le membre ne les a pas remplacées.
 */

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

const INSCRIPTION = "/public/inscription";

/** Comptes créés depuis une même origine en une heure. */
const COMPTES_PAR_HEURE = 5;

/**
 * Création du compte : courriel, fonction, téléphone (facultatif), mot de
 * passe. La session ne s'ouvre pas ici : on renvoie vers la connexion, et la
 * première connexion mène à la présentation pas à pas.
 */
export async function creerCompte(formData: FormData) {
  // Une même origine ne crée pas des comptes à la chaîne.
  const attente = tentative(
    `inscription:${await origineAppelante()}`,
    COMPTES_PAR_HEURE,
    60 * 60 * 1000,
  );
  if (attente) {
    redirectWithErreur(
      INSCRIPTION,
      `Trop d’inscriptions depuis cet appareil. Réessayez dans ${minutes(attente)} minute${minutes(attente) > 1 ? "s" : ""}.`,
    );
  }

  const email = texte(formData, "email").toLowerCase();
  const motDePasse = String(formData.get("motDePasse") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const fonction = texte(formData, "fonction").slice(0, 80);
  const tel = texte(formData, "tel");

  if (!email.includes("@")) {
    redirectWithErreur(INSCRIPTION, "Indiquez une adresse courriel valide.");
  }
  if (motDePasse.length < MOT_DE_PASSE_MIN) {
    redirectWithErreur(
      INSCRIPTION,
      `Le mot de passe fait au moins ${MOT_DE_PASSE_MIN} caractères.`,
    );
  }
  if (motDePasse !== confirmation) {
    redirectWithErreur(
      INSCRIPTION,
      "Les deux mots de passe ne correspondent pas.",
    );
  }
  if (!fonction) {
    redirectWithErreur(INSCRIPTION, "Indiquez votre fonction.");
  }
  if (tel && !telephoneValide(tel)) {
    redirectWithErreur(
      INSCRIPTION,
      `« ${tel} » n’est pas un numéro de téléphone valide.`,
    );
  }
  if (
    await prisma.user.findUnique({ where: { email }, select: { id: true } })
  ) {
    redirectWithErreur(
      INSCRIPTION,
      "Cette adresse a déjà un compte : connectez-vous.",
    );
  }

  const nom = nomDepuisCourriel(email);
  const membre = await prisma.member.create({
    data: {
      type: "morale",
      nom: PROVISOIRE.entreprise,
      secteur: PROVISOIRE.secteur,
      ville: PROVISOIRE.ville,
      statut: "candidature",
      adhesion: jourBase(),
      activite: PROVISOIRE.activite,
      desc: PROVISOIRE.desc,
      accueilEnCours: true,
    },
  });

  // La personne qui s'inscrit devient le contact principal : c'est elle que
  // la chambre appellera, et le compte avec lequel elle se connecte.
  await prisma.user.create({
    data: {
      role: "membre",
      nom,
      fonction,
      email,
      tel: tel || null,
      motDePasse: hacher(motDePasse),
      memberId: membre.id,
      contactPrincipal: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "candidature_deposee",
      entite: "Member",
      entiteId: membre.id,
      acteur: nom,
      detail: `Inscription de ${email}.`,
    },
  });

  // Les e-mails partent après la réponse : l'inscription n'attend pas le
  // service d'envoi, et ne dépend pas de lui.
  const [bienvenue, inscriptions] = await Promise.all([
    urlPublique("/bienvenue"),
    urlPublique("/admin/equipe"),
  ]);
  after(() =>
    Promise.all([
      envoyerCourriel(courrielBienvenue(email, nom, bienvenue)),
      envoyerCourriel(
        courrielNouvelleInscription(
          COURRIEL_EQUIPE,
          email,
          [`Fonction : ${fonction}`, tel ? `Téléphone : ${tel}` : null],
          inscriptions,
        ),
      ),
    ]),
  );

  revalidatePath("/", "layout");
  // Retour à la connexion, l'adresse déjà remplie.
  redirect(`/public?${new URLSearchParams({ inscrit: "1", email })}`);
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
      let logo: string | null = null;
      try {
        logo = await enregistrerImage(formData.get("logo"), {
          prefixe: `logo-${memberId}`,
          largeur: 600,
          transparence: true,
        });
      } catch (e) {
        if (e instanceof ImageRefusee) redirectWithErreur(ici, e.message);
        throw e;
      }
      await prisma.member.update({
        where: { id: memberId },
        data: {
          activite: texte(formData, "activite") || PROVISOIRE.activite,
          desc: texte(formData, "desc") || PROVISOIRE.desc,
          besoins: texte(formData, "besoins") || null,
          // Sans nouveau fichier, le logo en place reste.
          ...(logo ? { logo } : {}),
        },
      });
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
