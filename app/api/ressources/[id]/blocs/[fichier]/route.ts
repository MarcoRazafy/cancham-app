import { ENTETES_PROTEGES, verifierAcces } from "@/lib/acces-ressources";
import { estFichierBloc, typeFichierBloc } from "@/lib/blocs";
import { servirFichier } from "@/lib/flux";
import { cheminBloc, existe } from "@/lib/stockage-ressources";

/**
 * La photo ou la vidéo d'un bloc, dans une page de ressource composée.
 *
 * Même règle que pour les pages d'un document : l'accès est vérifié à chaque
 * requête — et pour une vidéo, à chaque morceau. Sans lui, l'adresse d'une
 * photo suffirait à la sortir d'un dossier réservé ou d'une ressource payante.
 */
export async function GET(
  requete: Request,
  { params }: { params: Promise<{ id: string; fichier: string }> },
) {
  const { id, fichier } = await params;
  const acces = await verifierAcces(id);
  if (!acces.ok) return new Response(acces.message, { status: acces.statut });

  // Le nom vient de l'adresse : seul le motif de ceux qu'on fabrique passe.
  if (!estFichierBloc(fichier))
    return new Response("Fichier introuvable.", { status: 404 });
  const chemin = cheminBloc(id, fichier);
  if (!(await existe(chemin)))
    return new Response("Fichier introuvable.", { status: 404 });

  return servirFichier(requete, chemin, {
    ...ENTETES_PROTEGES,
    "Content-Type": typeFichierBloc(fichier),
  });
}
