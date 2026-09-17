import { prisma } from "@/lib/db";
import { servirFichier } from "@/lib/flux";
import { isAccessLocked } from "@/lib/membership";
import { getMember } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { cheminPiece, mimePiece } from "@/lib/stockage-messagerie";
import { existe } from "@/lib/stockage-ressources";

/**
 * Une pièce jointe de la messagerie.
 *
 * Contrôle d'accès rejoué ici : `/api` échappe au verrou de `proxy.ts`. La
 * pièce n'est servie qu'aux participants du fil de son message — à qui n'y
 * participe pas, elle répond « introuvable » plutôt qu'« interdite », pour ne
 * pas confirmer qu'elle existe.
 *
 * Tant que l'authentification n'existe pas, l'utilisateur est déduit de
 * l'espace (`?espace=`), comme partout ailleurs dans l'application. Le jour où
 * les sessions arriveront, seul `getCurrentUser` changera.
 *
 * `?telecharger=1` propose l'enregistrement ; sans lui, le navigateur affiche.
 * Contrairement aux ressources, une pièce jointe appartient aux personnes qui
 * l'échangent : elles peuvent la garder.
 */
export async function GET(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(requete.url);
  const espace =
    url.searchParams.get("espace") === "admin" ? "admin" : "membre";

  const user = await getCurrentUser(espace);
  if (espace === "membre") {
    const membre = user.memberId ? await getMember(user.memberId) : null;
    if (!membre || isAccessLocked(membre)) {
      return new Response("Accès réservé aux membres à jour de cotisation.", {
        status: 403,
      });
    }
  }

  const piece = await prisma.pieceJointe.findFirst({
    where: {
      id,
      message: { thread: { participants: { some: { userId: user.id } } } },
    },
  });
  if (!piece) return new Response("Pièce jointe introuvable.", { status: 404 });

  const chemin = cheminPiece(piece.fichier);
  if (!(await existe(chemin)))
    return new Response("Pièce jointe introuvable.", { status: 404 });

  const telecharger = url.searchParams.has("telecharger");
  const nom = encodeURIComponent(piece.nom);

  return servirFichier(requete, chemin, {
    "Content-Type": mimePiece(piece.fichier),
    "Content-Disposition": `${telecharger ? "attachment" : "inline"}; filename*=UTF-8''${nom}`,
    // `private` et varié par espace : l'URL porte l'espace, deux lecteurs
    // différents n'en partagent donc jamais la réponse en cache.
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
  });
}
