import { type NextRequest } from "next/server";
import { destinationDuRetour } from "@/lib/retour-paiement";

/**
 * Relais du retour de paiement.
 *
 * Le prestataire ramène ici le payeur, et le relais l'envoie à la page de la
 * plateforme qui l'attend : le retour de l'espace membre, ou le billet
 * d'une inscription publique. Il ne règle rien — c'est la notification
 * signée qui fait foi — et ne lit rien en base : il redirige, c'est tout.
 *
 * Il répond à un lien comme à un formulaire posté : selon le moyen de
 * paiement, le prestataire ne revient pas de la même façon, et une page
 * ordinaire refuserait un envoi posté. La réponse 303 fait du retour une
 * simple visite, à laquelle le navigateur joint la session du membre.
 */
function relais(request: NextRequest) {
  const destination = destinationDuRetour(
    request.nextUrl.searchParams.get("vers"),
  );
  // Un chemin, et non une adresse complète : derrière un mandataire, l'hôte
  // de la requête n'est pas celui que voit le navigateur.
  return new Response(null, {
    status: 303,
    headers: { Location: destination, "Cache-Control": "no-store" },
  });
}

export const GET = relais;
export const POST = relais;
