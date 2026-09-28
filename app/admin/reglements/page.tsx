import Link from "next/link";
import { Check, Settings2, X } from "lucide-react";
import { ilYa } from "@/components/admin/LigneJournal";
import { SubmitButton } from "@/components/form-bits";
import { Card, EmptyState, Pill, ViewHead } from "@/components/ui";
import { confirmerReglement, refuserReglement } from "@/lib/actions/reglements";
import { prisma } from "@/lib/db";
import { exigerEquipe } from "@/lib/autorisations";
import { fmtMontant } from "@/lib/membership";
import { MODES } from "@/lib/reglements";

/**
 * Les règlements annoncés hors ligne, en attente d'un constat.
 *
 * Le membre dit avoir payé ; l'argent, lui, arrive à la banque avec un jour
 * ou deux de décalage. Cet écran est l'endroit où l'équipe rapproche les deux
 * — la référence du règlement se retrouve dans le motif du virement.
 *
 * Confirmer solde la facture et remet le membre à jour. Écarter ne détruit
 * rien : le règlement reste, marqué comme non constaté.
 */
export default async function Reglements() {
  await exigerEquipe();

  const [annonces, recents] = await Promise.all([
    prisma.paiement.findMany({
      where: { statut: "annonce" },
      include: {
        invoice: { select: { numero: true, objet: true } },
        member: { select: { nom: true } },
      },
      orderBy: { annonceLe: "asc" },
    }),
    prisma.paiement.findMany({
      where: { statut: "reussie" },
      include: {
        invoice: { select: { numero: true } },
        member: { select: { nom: true } },
      },
      orderBy: { regleLe: "desc" },
      take: 8,
    }),
  ]);

  return (
    <>
      <ViewHead
        title="Règlements annoncés"
        action={
          <Link
            href="/admin/reglements/coordonnees"
            className="btn-contour btn-contour-sm no-underline"
          >
            <Settings2 size={15} /> Coordonnées de paiement
          </Link>
        }
      >
        Ce que des membres disent avoir réglé hors ligne. Confirmez dès que
        l’argent est constaté : la facture se solde et l’adhésion repasse à
        jour.
      </ViewHead>

      {annonces.length ? (
        <div className="grid gap-3">
          {annonces.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-[family-name:var(--font-mono)] text-[14px] font-bold text-accent">
                      {p.reference}
                    </span>
                    <Pill>{MODES[p.mode].titre}</Pill>
                  </div>
                  <div className="mt-1.5 text-[15px] font-semibold text-ink">
                    {p.member?.nom ?? "Membre supprimé"} ·{" "}
                    {fmtMontant(p.montant, p.devise)}
                  </div>
                  <div className="mt-0.5 text-[12.8px] text-muted">
                    {p.invoice
                      ? `${p.invoice.objet} · facture ${p.invoice.numero}`
                      : "Sans facture"}
                    {p.annonceLe
                      ? ` · annoncé ${ilYa(p.annonceLe.toISOString())}`
                      : ""}
                  </div>
                  {p.refBancaire ? (
                    <div className="mt-1.5 text-[12.8px] text-muted">
                      Référence donnée par le membre :{" "}
                      <span className="font-[family-name:var(--font-mono)] text-ink">
                        {p.refBancaire}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <form action={refuserReglement}>
                    <input type="hidden" name="reglementId" value={p.id} />
                    <SubmitButton sm variant="ghost" pendingLabel="…">
                      <X size={14} /> Écarter
                    </SubmitButton>
                  </form>
                  <form action={confirmerReglement}>
                    <input type="hidden" name="reglementId" value={p.id} />
                    <SubmitButton sm pendingLabel="…">
                      <Check size={14} /> Argent reçu
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState>
          Aucun règlement en attente. Les membres qui annoncent un virement
          apparaîtront ici.
        </EmptyState>
      )}

      {recents.length ? (
        <>
          <h2 className="mt-8 mb-3 text-[15.5px] font-semibold">
            Derniers règlements confirmés
          </h2>
          <Card className="p-0">
            <ul className="m-0 list-none p-0">
              {recents.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-5 py-3 text-[13.2px] last:border-b-0"
                >
                  <span className="font-[family-name:var(--font-mono)] text-muted">
                    {p.reference}
                  </span>
                  <span className="font-semibold text-ink">
                    {p.member?.nom ?? "—"}
                  </span>
                  <span className="text-muted">
                    {fmtMontant(p.montant, p.devise)} · {MODES[p.mode].titre}
                  </span>
                  <span className="ml-auto text-faint">
                    {p.regleLe ? ilYa(p.regleLe.toISOString()) : ""}
                    {p.confirmePar ? ` · ${p.confirmePar}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}
    </>
  );
}
