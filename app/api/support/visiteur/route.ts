import { conversationVisiteur } from "@/lib/support-visiteur";

const SANS_CACHE = { "Cache-Control": "no-store" };

/**
 * La conversation d'un visiteur, pour la bulle de la vitrine.
 *
 * Elle interroge cette route à intervalles réguliers : c'est ce qui fait
 * arriver la réponse de l'équipe sans recharger la page. Sans cookie, il n'y
 * a rien à montrer — et rien à dire de plus.
 */
export async function GET() {
  return Response.json(
    { fil: await conversationVisiteur() },
    { headers: SANS_CACHE },
  );
}
