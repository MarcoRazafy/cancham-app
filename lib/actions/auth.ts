"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { fermerSession, ouvrirSession, verifier } from "@/lib/auth";

/**
 * Connexion et déconnexion.
 *
 * Le message d'erreur reste volontairement le même, que l'adresse soit
 * inconnue ou le mot de passe faux : dire laquelle des deux ne va pas
 * revient à confirmer l'existence d'un compte à qui tente sa chance.
 */

const texte = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

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

  const u = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, motDePasse: true },
  });

  if (!u || !verifier(motDePasse, u.motDePasse)) {
    echec("Adresse ou mot de passe incorrect.", email);
  }

  await ouvrirSession(u.id);

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
