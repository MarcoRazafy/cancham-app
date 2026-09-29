import { redirect } from "next/navigation";

/**
 * L'ancienne page du choix du moyen.
 *
 * Le choix se fait désormais dans une fenêtre, par-dessus la liste des
 * factures. L'adresse reste servie — un lien envoyé par e-mail ou gardé en
 * favori y mène encore — et renvoie vers la liste, fenêtre ouverte.
 */
export default async function ChoisirMoyen({
  searchParams,
}: {
  searchParams: Promise<{ facture?: string }>;
}) {
  const { facture = "" } = await searchParams;
  redirect(
    facture
      ? `/membre/cotisations?regler=${encodeURIComponent(facture)}`
      : "/membre/cotisations",
  );
}
