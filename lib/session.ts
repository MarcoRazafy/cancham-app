import "server-only";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { fermerSession, sessionCourante, sessionPerimee } from "@/lib/auth";
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

/**
 * Efface le cookie quand c'est permis. Pendant le rendu d'une page, Next
 * interdit d'écrire les cookies : on n'insiste pas — un cookie refusé l'est
 * de nouveau à chaque requête, et la prochaine connexion le remplace.
 */
async function oublierCookie(): Promise<void> {
  try {
    await fermerSession();
  } catch {
    /* Rendu d'une page : écriture des cookies impossible, sans conséquence. */
  }
}

/** La personne connectée, sans exiger d'espace. `null` si personne. */
export async function utilisateurConnecte(): Promise<{
  id: string;
  role: UserRole;
  memberId: string | null;
  nom: string;
} | null> {
  const session = await sessionCourante();
  if (!session) return null;
  const u = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      role: true,
      memberId: true,
      nom: true,
      motDePasseModifieLe: true,
    },
  });
  if (!u || sessionPerimee(session, u.motDePasseModifieLe)) {
    // Compte supprimé, ou mot de passe changé depuis l'ouverture de la
    // session : le cookie ne vaut plus rien.
    await oublierCookie();
    return null;
  }
  return { id: u.id, role: u.role, memberId: u.memberId, nom: u.nom };
}

export async function getCurrentUser(space: Space): Promise<User> {
  const session = await sessionCourante();
  if (!session) redirect(CONNEXION);

  const u = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!u || sessionPerimee(session, u.motDePasseModifieLe)) {
    await oublierCookie();
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
