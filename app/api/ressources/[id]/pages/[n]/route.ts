import { readFile } from "node:fs/promises";
import { ENTETES_PROTEGES, verifierAcces } from "@/lib/acces-ressources";
import { cheminPage, existe } from "@/lib/stockage-ressources";

/**
 * Une page de document, rendue en image.
 *
 * L'accès est vérifié à chaque page : sans lui, il suffirait de l'adresse
 * pour lire un document payant. L'image part telle qu'elle a été rendue au
 * dépôt, sans filigrane.
 */
export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ id: string; n: string }> },
) {
  const { id, n } = await params;
  const acces = await verifierAcces(id);
  if (!acces.ok) return new Response(acces.message, { status: acces.statut });

  const numero = Number(n);
  if (
    !Number.isInteger(numero) ||
    numero < 1 ||
    numero > (acces.ressource.pages ?? 0)
  ) {
    return new Response("Page introuvable.", { status: 404 });
  }

  const chemin = cheminPage(id, numero);
  if (!(await existe(chemin)))
    return new Response("Page introuvable.", { status: 404 });

  return new Response(new Uint8Array(await readFile(chemin)), {
    headers: { ...ENTETES_PROTEGES, "Content-Type": "image/png" },
  });
}
