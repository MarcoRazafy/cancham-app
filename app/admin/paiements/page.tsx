import { Stat, StatusPill, TableWrap, Td, Th, ViewHead } from "@/components/ui";
import { getEncaisse, getInvoices, getMemberStats } from "@/lib/queries";
import { fmtMoney } from "@/lib/format";

export default async function AdminPaiements() {
  const [factures, encaisse, stats] = await Promise.all([
    getInvoices(),
    getEncaisse(),
    getMemberStats(),
  ]);

  return (
    <>
      <ViewHead title="Paiements & factures">
        Suivi des cotisations et des facturations liées aux événements.
      </ViewHead>

      <div className="grid gap-4 mb-5 md:grid-cols-3">
        <Stat k="Encaissé" v={<span className="text-[21px]">{fmtMoney(encaisse)}</span>} />
        <Stat k="Factures émises" v={factures.length} />
        <Stat k="Membres en retard" v={stats.enRetard} vClassName="text-bad" />
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Facture</Th>
            <Th>Membre</Th>
            <Th>Objet</Th>
            <Th>Montant</Th>
            <Th>Statut</Th>
          </tr>
        </thead>
        <tbody>
          {factures.map((f) => (
            <tr key={f.id} className="hover:bg-surface-2">
              <Td className="font-[family-name:var(--font-mono)]">{f.numero}</Td>
              <Td>{f.membre}</Td>
              <Td>{f.objet}</Td>
              <Td className="font-[family-name:var(--font-mono)]">{fmtMoney(f.montant)}</Td>
              <Td>
                <StatusPill status={f.statut} />
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <p className="text-[11.5px] text-faint mt-4">
        Les montants sont en Ariary. Les dates de facture antérieures à 2026 sont
        conservées pour l’historique.
      </p>
    </>
  );
}
