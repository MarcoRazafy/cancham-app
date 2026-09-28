import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Banner, BtnLink, Card, ViewHead } from "@/components/ui";
import { prisma } from "@/lib/db";
import { fmtMontant } from "@/lib/membership";
import { conclurePaiement } from "@/lib/paiements";
import { getCurrentUser } from "@/lib/session";
import { interrogerStatut, type ModePaiement } from "@/lib/vanillapay";

/**
 * Retour de la page de paiement.
 *
 * Elle ne règle rien par elle-même : c'est la notification signée qui fait
 * foi, et un membre pourrait fabriquer cette adresse. Elle sert à dire où
 * l'on en est — et, quand la notification n'est pas encore arrivée, à
 * demander l'état au prestataire depuis le serveur, ce qui est sûr.
 */
export default async function RetourPaiementPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref = "" } = await searchParams;
  const user = await getCurrentUser("membre");

  const p = ref
    ? await prisma.paiement.findUnique({
        where: { reference: ref },
        include: { invoice: { select: { numero: true, memberId: true } } },
      })
    : null;
  // Une référence qui n'est pas la sienne n'existe pas pour lui.
  if (!p || !user.memberId || p.invoice.memberId !== user.memberId) notFound();

  // La notification a pu se perdre : on demande l'état, et on conclut avec
  // la même porte que le webhook — donc sans double règlement possible.
  let statut = p.statut;
  if (statut === "en_cours") {
    const etat = await interrogerStatut(
      p.transaction ?? p.reference,
      p.mode as ModePaiement,
    );
    if (etat) {
      await conclurePaiement(etat, etat);
      statut =
        (
          await prisma.paiement.findUnique({
            where: { id: p.id },
            select: { statut: true },
          })
        )?.statut ?? statut;
    }
  }

  const montant = fmtMontant(p.montant, p.devise);

  return (
    <>
      <ViewHead title="Paiement de la cotisation" />

      <Card className="p-6 max-w-[620px]">
        {statut === "reussie" ? (
          <Banner
            tone="ok"
            icon={<CheckCircle2 size={18} />}
            title="Paiement reçu"
          >
            La facture {p.invoice.numero} est réglée : {montant} encaissés.
            Votre adhésion est à jour, et votre certificat le dit déjà.
          </Banner>
        ) : statut === "echouee" ? (
          <Banner
            tone="bad"
            icon={<XCircle size={18} />}
            title="Paiement refusé"
          >
            Rien n’a été débité. Vous pouvez recommencer, ou régler par virement
            — l’équipe enregistrera le règlement.
          </Banner>
        ) : (
          <Banner
            tone="warn"
            icon={<Clock size={18} />}
            title="Paiement en cours"
          >
            Votre banque n’a pas encore confirmé. Cela prend parfois quelques
            minutes : revenez sur cette page ou rechargez-la. La facture sera
            marquée réglée d’elle-même dès la confirmation.
          </Banner>
        )}

        <div className="mt-5 text-[12.8px] text-muted">
          Référence de la tentative :{" "}
          <span className="font-[family-name:var(--font-mono)] text-ink">
            {p.reference}
          </span>
        </div>

        <div className="mt-5">
          <BtnLink href="/membre/cotisations" variant="ghost" sm>
            <ArrowLeft size={14} /> Retour aux cotisations
          </BtnLink>
        </div>
      </Card>
    </>
  );
}
