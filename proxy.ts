import { NextResponse, type NextRequest } from "next/server";
import { lireJeton, NOM_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAccessLocked, PAGES_TOUJOURS_OUVERTES } from "@/lib/membership";

/**
 * Garde d'entrée des espaces privés.
 *
 * Deux règles s'appliquent avant même que la page ne soit rendue :
 *   1. il faut une session, et son rôle doit correspondre à l'espace demandé ;
 *   2. côté membre, l'accès dépend de la cotisation — c'est le modèle
 *      économique de la chambre, et il ne peut pas vivre côté navigateur.
 *
 * Le proxy tourne en runtime Node.js depuis Next 16, ce qui permet d'y
 * interroger la base directement. Il assure la redirection ; chaque page
 * sensible reste responsable de ses propres autorisations : un proxy protège
 * des URL, pas des données.
 */

/**
 * Pages de l'espace membre restant accessibles quand l'adhésion n'est pas
 * effective : c'est là que le membre consulte sa situation et régularise.
 */
const TOUJOURS_OUVERT = PAGES_TOUJOURS_OUVERTES;
const REPLI = "/membre/profil";
const CONNEXION = "/public";

const ACCUEIL: Record<string, string> = {
  membre: "/membre",
  admin: "/admin",
  visiteur: CONNEXION,
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const espace = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/membre")
      ? "membre"
      : null;
  if (!espace) return NextResponse.next();

  const vers = (chemin: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = chemin;
    url.search = "";
    for (const [k, v] of Object.entries(params ?? {})) {
      url.searchParams.set(k, v);
    }
    return NextResponse.redirect(url);
  };

  const userId = lireJeton(request.cookies.get(NOM_COOKIE)?.value);
  if (!userId) return vers(CONNEXION, { suite: pathname });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, memberId: true },
  });
  if (!user) return vers(CONNEXION);
  // Chacun chez soi : un membre n'entre pas dans le back-office.
  if (user.role !== espace) return vers(ACCUEIL[user.role] ?? CONNEXION);

  if (espace === "admin") return NextResponse.next();
  if (TOUJOURS_OUVERT.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const member = user.memberId
    ? await prisma.member.findUnique({
        where: { id: user.memberId },
        select: { statut: true, retardDepuis: true },
      })
    : null;

  // `isAccessLocked` attend le modèle de vue : la date y est une ISO courte.
  const vue = member
    ? {
        statut: member.statut,
        retardDepuis: member.retardDepuis
          ? member.retardDepuis.toISOString().slice(0, 10)
          : null,
      }
    : null;

  if (isAccessLocked(vue as Parameters<typeof isAccessLocked>[0])) {
    return vers(REPLI, { verrouille: "1" });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/membre/:path*", "/admin/:path*"],
};
