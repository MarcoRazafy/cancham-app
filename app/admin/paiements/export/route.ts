import { exigerEquipe } from "@/lib/autorisations";
import { reponseCsv, versCsv } from "@/lib/csv";
import { filtrerFactures, lireFiltresFactures } from "@/lib/filtres-factures";
import { getInvoices } from "@/lib/queries";

/** Factures au format tableur, avec les filtres de la page. */
export async function GET(requete: Request) {
  // Le proxy garde déjà /admin ; l'export le redit pour lui-même.
  await exigerEquipe();
  const params = Object.fromEntries(new URL(requete.url).searchParams);
  const factures = filtrerFactures(
    await getInvoices(),
    lireFiltresFactures(params),
  );

  const csv = versCsv(
    ["Numéro", "Date", "Membre", "Objet", "Montant", "Devise", "Statut"],
    factures.map((f) => [
      f.numero,
      f.date,
      f.membre,
      f.objet,
      f.montant,
      f.devise,
      f.statut === "payee" ? "Payée" : "À régler",
    ]),
  );
  return reponseCsv("factures-cancham", csv);
}
