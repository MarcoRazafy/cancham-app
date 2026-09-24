import { NextResponse, type NextRequest } from "next/server";
import { lireSession, NOM_COOKIE, sessionPerimee } from "@/lib/auth";
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
const CONNEXION = "/auth";

/**
 * Domaine principal du site, une fois le nom branché sur l'hébergeur.
 *
 * Posé (`DOMAINE_PRINCIPAL=cancham.mg`), il devient l'adresse unique :
 * `www.cancham.mg` et `app.cancham.mg` y renvoient en gardant le chemin, si
 * bien que les liens déjà envoyés — réinitialisations, invitations, billets —
 * continuent d'aboutir. Vide, rien ne bouge : c'est l'état du développement,
 * et celui d'avant la bascule.
 */
const DOMAINE = process.env.DOMAINE_PRINCIPAL?.trim().toLowerCase() || null;

/** Renvoie vers le domaine principal, ou `null` si l'on y est déjà. */
function versDomainePrincipal(request: NextRequest): NextResponse | null {
  if (!DOMAINE) return null;
  const hote = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    ""
  )
    .toLowerCase()
    .split(":")[0];
  // Ni en développement, ni derrière une adresse IP : on ne redirige que des
  // noms de domaine, et seulement s'ils diffèrent du principal.
  if (
    !hote ||
    hote === DOMAINE ||
    hote === "localhost" ||
    /^[\d.]+$/.test(hote)
  ) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = DOMAINE;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

const ACCUEIL: Record<string, string> = {
  membre: "/membre",
  admin: "/admin",
  visiteur: CONNEXION,
};

export default async function proxy(request: NextRequest) {
  // Une seule adresse pour le site : tout le reste y renvoie.
  const canonique = versDomainePrincipal(request);
  if (canonique) return canonique;

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

  const session = lireSession(request.cookies.get(NOM_COOKIE)?.value);
  if (!session) return vers(CONNEXION, { suite: pathname });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, memberId: true, motDePasseModifieLe: true },
  });
  // Compte supprimé, ou mot de passe changé depuis l'ouverture de la session.
  if (!user || sessionPerimee(session, user.motDePasseModifieLe)) {
    return vers(CONNEXION);
  }
  // Chacun chez soi : un membre n'entre pas dans le back-office.
  if (user.role !== espace) return vers(ACCUEIL[user.role] ?? CONNEXION);

  if (espace === "admin") return NextResponse.next();

  const member = user.memberId
    ? await prisma.member.findUnique({
        where: { id: user.memberId },
        select: { statut: true, retardDepuis: true },
      })
    : null;

  // Candidature à l'examen : pas encore d'espace, pas même le profil.
  if (member?.statut === "candidature")
    return vers(CONNEXION, { attente: "1" });

  if (TOUJOURS_OUVERT.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

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
  /**
   * Le proxy voit toutes les pages — il lui faut la vitrine pour ramener les
   * visiteurs sur le domaine principal —, mais jamais un fichier servi tel
   * quel : une redirection sur une feuille de style ou une image casserait la
   * page. `api` en est exclu aussi, pour que la sonde de santé de
   * l'hébergeur réponde sans détour.
   */
  matcher: [
    "/((?!api|_next/static|_next/image|televersements|favicon.ico|apple-icon.png).*)",
  ],
};
