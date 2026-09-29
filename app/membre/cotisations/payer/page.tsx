import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubmitButton } from "@/components/form-bits";
import { IconeMode } from "@/components/paiement/IconeMode";
import { Card, EmptyState, ViewHead } from "@/components/ui";
import { prisma } from "@/lib/db";
import { fmtMontant } from "@/lib/membership";
import { MODES, modesProposes } from "@/lib/reglements";
import { ouvrirReglement } from "@/lib/actions/reglements";
import { getCurrentUser } from "@/lib/session";

/**
 * Le choix du moyen de paiement.
 *
 * Un seul écran, quel que soit ce qu'on règle. Les moyens dont les
 * coordonnées ne sont pas renseignées n'y figurent pas : un choix plus court
 * vaut mieux qu'un virement envoyé dans le vide.
 */
export default async function ChoisirMoyen({
  searchParams,
}: {
  searchParams: Promise<{ facture?: string }>;
}) {
  const { facture = "" } = await searchParams;
  const user = await getCurrentUser("membre");

  const f = await prisma.invoice.findUnique({
    where: { id: facture },
    select: {
      id: true,
      numero: true,
      objet: true,
      montant: true,
      devise: true,
      statut: true,
      memberId: true,
    },
  });
  if (!f || !user.memberId || f.memberId !== user.memberId) notFound();

  const proposes = await modesProposes();

  return (
    <>
      <div className="mb-4">
        <Link
          href="/membre/cotisations"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-accent"
        >
          <ArrowLeft size={14} /> Cotisations &amp; factures
        </Link>
      </div>

      <ViewHead title="Comment payerez-vous ?">
        Facture {f.numero} · {f.objet} ·{" "}
        <b className="text-ink">{fmtMontant(f.montant, f.devise)}</b>
      </ViewHead>

      {f.statut === "payee" ? (
        <EmptyState>Cette facture est déjà réglée.</EmptyState>
      ) : proposes.length ? (
        <form action={ouvrirReglement}>
          <input type="hidden" name="factureId" value={f.id} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {proposes.map((m) => (
              <SubmitButton
                key={m}
                name="mode"
                value={m}
                variant="line"
                className="h-full flex-col items-start gap-1 px-4 py-4 text-left"
                pendingLabel="…"
              >
                <span className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
                  <IconeMode mode={m} />
                  {MODES[m].titre}
                </span>
                <span className="text-[12.4px] font-normal leading-snug text-muted">
                  {MODES[m].detail}
                </span>
              </SubmitButton>
            ))}
          </div>
        </form>
      ) : (
        <Card className="p-6">
          <p className="m-0 text-[13.8px] text-muted">
            Aucun moyen de paiement n’est encore configuré. Écrivez à l’équipe :
            elle vous indiquera comment régler, et renseignera les coordonnées
            de la chambre.
          </p>
        </Card>
      )}
    </>
  );
}
