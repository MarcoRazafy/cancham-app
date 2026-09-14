import { prisma } from "@/lib/db";
import type { Space, User, UserRole } from "@/lib/types";

/**
 * Utilisateur courant.
 *
 * Il n'y a pas encore d'authentification : l'espace est déterminé par l'URL, et
 * l'utilisateur est celui que la base porte pour le rôle correspondant.
 *
 * C'est le seul point à réécrire le jour où les sessions arriveront — il lira
 * alors le cookie de session plutôt que le rôle. Rien d'autre dans
 * l'application ne dépend de la façon dont l'utilisateur est résolu.
 */

const ROLE_PAR_ESPACE: Record<Space, UserRole> = {
  public: "visiteur",
  membre: "membre",
  admin: "admin",
};

export async function getCurrentUser(space: Space): Promise<User> {
  const role = ROLE_PAR_ESPACE[space];
  const u = await prisma.user.findFirst({
    where: { role },
    orderBy: { createdAt: "asc" },
  });

  if (!u) {
    throw new Error(
      `Aucun utilisateur de rôle « ${role} » en base. Lancez « npm run db:seed ».`,
    );
  }

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
