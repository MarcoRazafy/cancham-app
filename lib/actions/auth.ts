"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { fermerSession, ouvrirSession, verifier } from "@/lib/auth";
import { minutes, oublier, origineAppelante, tentative } from "@/lib/limite";

/**
 * Connexion et déconnexion.
 *
 * Le message d'erreur reste volontairement le même, que l'adresse soit
 * inconnue ou le mot de passe faux : dire laquelle des deux ne va pas
 * revient à confirmer l'existence d'un compte à qui tente sa chance.
 */

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Tentatives tolérées par quart d'heure : sur un compte, puis sur une origine. */
const ESSAIS_PAR_COMPTE = 8;
const ESSAIS_PAR_ORIGINE = 30;
const FENETRE = 15 * 60 * 1000;

const ACCUEIL: Record<string, string> = {
  membre: "/membre",
  admin: "/admin",
  visiteur: "/membre/profil",
};

/** Retour à la connexion, motif et adresse saisie conservés. */
function echec(message: string, email: string): never {
  const q = new URLSearchParams({ erreur: message });
  if (email) q.set("email", email);
  redirect(`/public?${q}`);
}

export async function connexion(formData: FormData) {
  const email = texte(formData, "email").toLowerCase();
  const motDePasse = String(formData.get("motDePasse") ?? "");

  if (!email || !motDePasse) {
    echec("Indiquez votre adresse et votre mot de passe.", email);
  }

  // Essayer les mots de passe en série n'avance à rien : le compte visé se
  // ferme au bout de quelques essais, et l'origine aussi.
  const origine = await origineAppelante();
  const attente = Math.max(
    tentative(`connexion:${origine}:${email}`, ESSAIS_PAR_COMPTE, FENETRE),
    tentative(`connexion:${origine}`, ESSAIS_PAR_ORIGINE, FENETRE),
  );
  if (attente) {
    echec(
      `Trop de tentatives de connexion. Réessayez dans ${minutes(attente)} minute${
        minutes(attente) > 1 ? "s" : ""
      }.`,
      email,
    );
  }

  const u = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      motDePasse: true,
      member: { select: { accueilEnCours: true, statut: true } },
    },
  });

  if (!u || !verifier(motDePasse, u.motDePasse)) {
    echec("Adresse ou mot de passe incorrect.", email);
  }

  // Une candidature à l'examen n'ouvre pas encore de session. On ne le dit
  // qu'une fois le mot de passe vérifié : l'état d'une demande ne regarde
  // que son auteur.
  if (u.role === "membre" && u.member?.statut === "candidature") {
    oublier(`connexion:${origine}:${email}`);
    redirect(`/public?${new URLSearchParams({ attente: "1", email })}`);
  }

  // Connexion réussie : le compteur de cette adresse repart à zéro.
  oublier(`connexion:${origine}:${email}`);
  await ouvrirSession(u.id, texte(formData, "souvenir") === "1");

  // Une inscription pas encore terminée reprend là où elle s'est arrêtée :
  // la présentation d'abord, l'espace ensuite.
  if (u.role === "membre" && u.member?.accueilEnCours) redirect("/bienvenue");

  // Retour à la page demandée avant la connexion, si elle appartient bien à
  // l'espace de la personne : sinon, son accueil.
  const accueil = ACCUEIL[u.role] ?? "/membre";
  const suite = texte(formData, "suite");
  const sienne = suite === `/${u.role}` || suite.startsWith(`/${u.role}/`);
  redirect(sienne ? suite : accueil);
}

export async function deconnexion() {
  await fermerSession();
  redirect("/public");
}
