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
 * Contrôle d'accès rejoué ici : `/api` échappe au verrou de `proxy.ts`. Tant
 * que l'authentification n'existe pas, la messagerie de démonstration n'a pas
 * de participants par fil — le contrôle porte donc sur l'adhésion du membre.
 * Le jour où les sessions arriveront, il faudra vérifier que le lecteur
 * participe bien au fil du message.
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

  const user = await getCurrentUser("membre");
  const membre = user.memberId ? await getMember(user.memberId) : null;
  if (!membre || isAccessLocked(membre)) {
    return new Response("Accès réservé aux membres à jour de cotisation.", {
      status: 403,
    });
  }

  const piece = await prisma.pieceJointe.findUnique({ where: { id } });
  if (!piece) return new Response("Pièce jointe introuvable.", { status: 404 });

  const chemin = cheminPiece(piece.fichier);
  if (!(await existe(chemin)))
    return new Response("Pièce jointe introuvable.", { status: 404 });

  const telecharger = new URL(requete.url).searchParams.has("telecharger");
  const nom = encodeURIComponent(piece.nom);

  return servirFichier(requete, chemin, {
    "Content-Type": mimePiece(piece.fichier),
    "Content-Disposition": `${telecharger ? "attachment" : "inline"}; filename*=UTF-8''${nom}`,
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
  });
}
