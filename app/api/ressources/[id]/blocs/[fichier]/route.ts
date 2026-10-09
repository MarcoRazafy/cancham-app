import { ENTETES_PROTEGES, verifierAcces } from "@/lib/acces-ressources";
import { estFichierBloc, typeFichierBloc } from "@/lib/blocs";
import { servirFichier } from "@/lib/flux";
import { cheminBloc, existe } from "@/lib/stockage-ressources";

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ id: string; fichier: string }> },
) {
  const { id, fichier } = await params;
  const acces = await verifierAcces(id);
  if (!acces.ok) return new Response(acces.message, { status: acces.statut });

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
