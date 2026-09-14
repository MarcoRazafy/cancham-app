import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isAccessLocked } from "@/lib/membership";

/**
 * Application de la règle d'accès liée à la cotisation.
 *
 * Dans le prototype HTML, ce contrôle vivait uniquement dans la fonction `go()`,
 * côté navigateur : une console ouverte suffisait à tout débloquer. Ici il est
 * appliqué côté serveur, avant même que la page ne soit rendue.
 *
 * Le proxy tourne en runtime Node.js depuis Next 16, ce qui permet d'y
 * interroger la base directement.
 *
 * Il assure la redirection ; chaque page sensible reste responsable de ses
 * propres autorisations : un proxy protège des URL, pas des données.
 */

/**
 * Pages de l'espace membre restant accessibles quand l'adhésion n'est pas
 * effective : c'est là que le membre consulte sa situation et régularise.
 */
const TOUJOURS_OUVERT = ["/membre/profil", "/membre/cotisations"];
const REPLI = "/membre/profil";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/membre")) return NextResponse.next();
  if (TOUJOURS_OUVERT.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const user = await prisma.user.findFirst({
    where: { role: "membre" },
    orderBy: { createdAt: "asc" },
    select: { memberId: true },
  });

  const member = user?.memberId
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
    const url = request.nextUrl.clone();
    url.pathname = REPLI;
    url.searchParams.set("verrouille", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/membre/:path*"],
};
