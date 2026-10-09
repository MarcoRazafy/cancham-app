import { ENTETES_PROTEGES, verifierAcces } from "@/lib/acces-ressources";
import { servirFichier } from "@/lib/flux";
import { cheminFichier, existe } from "@/lib/stockage-ressources";

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const acces = await verifierAcces(id);
  if (!acces.ok) return new Response(acces.message, { status: acces.statut });

  if (!acces.ressource.fichier)
    return new Response("Vidéo introuvable.", { status: 404 });

  const chemin = cheminFichier(id, acces.ressource.fichier);
  if (!(await existe(chemin)))
    return new Response("Vidéo introuvable.", { status: 404 });

  return servirFichier(requete, chemin, {
    ...ENTETES_PROTEGES,
    "Content-Type": "video/mp4",
  });
}
