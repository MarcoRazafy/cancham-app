import "server-only";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { fermerSession, sessionCourante } from "@/lib/auth";
import type { Space, User, UserRole } from "@/lib/types";

/**
 * Utilisateur courant, d'après le cookie de session.
 *
 * Chaque espace attend un rôle : une personne connectée comme membre n'entre
 * pas dans le back-office, et l'inverse non plus. Sans session valable, on
 * repart vers la page de connexion — c'est le seul endroit de l'application
 * qui sait comment l'utilisateur est résolu.
 */

const ROLE_PAR_ESPACE: Record<Space, UserRole> = {
  public: "visiteur",
  membre: "membre",
  admin: "admin",
};

/** Page d'accueil de chaque rôle, pour renvoyer chacun chez lui. */
const ACCUEIL: Record<UserRole, string> = {
  membre: "/membre",
  admin: "/admin",
  visiteur: "/public",
};

export const CONNEXION = "/public";

/** La personne connectée, sans exiger d'espace. `null` si personne. */
export async function utilisateurConnecte(): Promise<{
  id: string;
  role: UserRole;
  memberId: string | null;
  nom: string;
} | null> {
  const id = await sessionCourante();
  if (!id) return null;
  const u = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, memberId: true, nom: true },
  });
  if (!u) {
    // Compte supprimé depuis l'ouverture de la session.
    await fermerSession();
    return null;
  }
  return u;
}

export async function getCurrentUser(space: Space): Promise<User> {
  const id = await sessionCourante();
  if (!id) redirect(CONNEXION);

  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) {
    await fermerSession();
    redirect(CONNEXION);
  }
  if (u.role !== ROLE_PAR_ESPACE[space]) redirect(ACCUEIL[u.role]);

  return {
    id: u.id,
    role: u.role,
    space,
    memberId: u.memberId,
    nom: u.nom,
    fonction: u.fonction,
    email: u.email,
    tel: u.tel ?? undefined,
    initiales: initiales(u.nom),
    photo: u.photo,
  };
}

function initiales(nom: string): string {
  return nom
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
