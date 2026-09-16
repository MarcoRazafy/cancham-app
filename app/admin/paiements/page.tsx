import {
  Saillant,
  Stat,
  StatusPill,
  TableWrap,
  Td,
  Th,
  ViewHead,
} from "@/components/ui";
import { getEncaisse, getInvoices, getMemberStats } from "@/lib/queries";
import { fmtMontant } from "@/lib/membership";

export default async function AdminPaiements() {
  const [factures, encaisse, stats] = await Promise.all([
    getInvoices(),
    getEncaisse(),
    getMemberStats(),
  ]);

  return (
    <>
      <ViewHead title={<>Paiements &amp; {<Saillant>factures</Saillant>}</>}>
        Suivi des cotisations et des facturations liées aux événements.
      </ViewHead>

      <div className="grid gap-4 mb-5 md:grid-cols-3">
        <Stat
          k="Encaissé"
          v={
            <span className="text-[21px] flex flex-col leading-tight">
              <span>{fmtMontant(encaisse.MGA, "MGA")}</span>
              {/* Le total en dollars n'apparaît que s'il existe : une ligne
                  « 0 $ » sur une chambre sans membre canadien serait du bruit. */}
              {encaisse.CAD ? (
                <span className="text-[15px] text-muted">
                  + {fmtMontant(encaisse.CAD, "CAD")}
                </span>
              ) : null}
            </span>
          }
        />
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
              <Td className="font-[family-name:var(--font-mono)]">
                {f.numero}
              </Td>
              <Td>{f.membre}</Td>
              <Td>{f.objet}</Td>
              <Td className="font-[family-name:var(--font-mono)]">
                {fmtMontant(f.montant, f.devise)}
              </Td>
              <Td>
                <StatusPill status={f.statut} />
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <p className="text-[11.5px] text-faint mt-4">
        Les montants sont en Ariary. Les dates de facture antérieures à 2026
        sont conservées pour l’historique.
      </p>
    </>
  );
}
