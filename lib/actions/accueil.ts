"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hacher, MOT_DE_PASSE_MIN, ouvrirSession } from "@/lib/auth";
import {
  ETAPES_ACCUEIL,
  NOMBRE_ETAPES,
  PROVISOIRE,
  nomDepuisCourriel,
} from "@/lib/accueil";
import { redirectWithFlash } from "@/lib/flash";
import { jourBase } from "@/lib/format";
import { normaliserSite } from "@/lib/liens";
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

/** Création du compte : courriel, mot de passe, motivation. */
export async function creerCompte(formData: FormData) {
  const email = texte(formData, "email").toLowerCase();
  const motDePasse = String(formData.get("motDePasse") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const motivation = texte(formData, "motivation");

  if (!email.includes("@")) {
    redirectWithFlash(INSCRIPTION, "Indiquez une adresse courriel valide.");
  }
  if (motDePasse.length < MOT_DE_PASSE_MIN) {
    redirectWithFlash(
      INSCRIPTION,
      `Le mot de passe fait au moins ${MOT_DE_PASSE_MIN} caractères.`,
    );
  }
  if (motDePasse !== confirmation) {
    redirectWithFlash(
      INSCRIPTION,
      "Les deux mots de passe ne correspondent pas.",
    );
  }
  if (!motivation) {
    redirectWithFlash(
      INSCRIPTION,
      "Dites-nous en quelques mots pourquoi vous souhaitez rejoindre CanCham.",
    );
  }
  if (
    await prisma.user.findUnique({ where: { email }, select: { id: true } })
  ) {
    redirectWithFlash(
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
      motivation,
      accueilEnCours: true,
    },
  });

  // La personne qui s'inscrit devient le contact principal : c'est elle que
  // la chambre appellera, et le compte avec lequel elle se connecte.
  const compte = await prisma.user.create({
    data: {
      role: "membre",
      nom,
      fonction: PROVISOIRE.fonction,
      email,
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

  revalidatePath("/", "layout");
  await ouvrirSession(compte.id);
  redirect("/bienvenue");
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
        redirectWithFlash(
          ici,
          "Indiquez votre prénom et votre nom, ou passez l’étape.",
        );
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          nom,
          fonction: texte(formData, "fonction") || PROVISOIRE.fonction,
          tel: texte(formData, "tel") || null,
        },
      });
      break;
    }

    case "entreprise": {
      const type = texte(formData, "type") === "physique" ? "physique" : "morale";
      // Un indépendant n'a pas d'entreprise : sa fiche porte son nom.
      const nom = texte(formData, "nom") || (type === "physique" ? user.nom : "");
      if (!nom) {
        redirectWithFlash(
          ici,
          "Indiquez le nom de votre entreprise, ou passez l’étape.",
        );
      }
      const siteSaisi = texte(formData, "siteweb");
      const siteweb = normaliserSite(siteSaisi);
      if (siteSaisi && !siteweb) {
        redirectWithFlash(
          ici,
          `« ${siteSaisi} » n’est pas une adresse de site valide.`,
        );
      }
      await prisma.member.update({
        where: { id: memberId },
        data: {
          type,
          nom,
          secteur: texte(formData, "secteur") || PROVISOIRE.secteur,
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
      if (formule in FORMULES) {
        await prisma.member.update({
          where: { id: memberId },
          data: { formule: formule as keyof typeof FORMULES },
        });
      }
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
        if (e instanceof ImageRefusee) redirectWithFlash(ici, e.message);
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
