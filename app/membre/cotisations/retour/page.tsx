import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Ticket, XCircle } from "lucide-react";
import { Banner, BtnLink, Card, ViewHead } from "@/components/ui";
import { prisma } from "@/lib/db";
import { fmtMontant } from "@/lib/membership";
import { conclurePaiement } from "@/lib/paiements";
import { getCurrentUser } from "@/lib/session";
import { canalVanillaPay, interrogerStatut } from "@/lib/vanillapay";

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
        include: {
          invoice: { select: { numero: true, memberId: true, eventId: true } },
        },
      })
    : null;
  // Une référence qui n'est pas la sienne n'existe pas pour lui.
  const proprietaire = p?.invoice?.memberId ?? p?.memberId ?? null;
  if (!p || !user.memberId || proprietaire !== user.memberId) notFound();

  // La notification a pu se perdre : on demande l'état, et on conclut avec
  // la même porte que le webhook — donc sans double règlement possible.
  let statut = p.statut;
  if (statut === "en_cours") {
    // La référence de la transaction chez eux, gardée à l'ouverture.
    const canal = canalVanillaPay(p.mode);
    const etat =
      canal && p.transaction
        ? await interrogerStatut(p.transaction, canal)
        : null;
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
  // Une participation réglée a ses billets ; une cotisation, son certificat.
  const evenement = p.invoice?.eventId ?? null;

  return (
    <>
      <ViewHead
        title={evenement ? "Paiement de la participation" : "Paiement de la cotisation"}
      />

      <Card className="p-6 max-w-[620px]">
        {statut === "reussie" ? (
          <Banner
            tone="ok"
            icon={<CheckCircle2 size={18} />}
            title="Paiement reçu"
          >
            La facture {p.invoice?.numero} est réglée : {montant} encaissés.
            {evenement
              ? " Votre inscription est confirmée : vos billets, avec leur QR code, partent à l’adresse donnée à l’inscription, et vous les retrouvez sur la fiche de l’événement."
              : " Votre adhésion est à jour, et votre certificat le dit déjà."}
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
            Le prestataire n’a pas encore confirmé. Cela prend parfois
            quelques minutes : revenez sur cette page ou rechargez-la. La
            facture sera marquée réglée d’elle-même dès la confirmation
            {evenement ? ", et vos billets partiront au même moment" : ""}.
          </Banner>
        )}

        <div className="mt-5 text-[12.8px] text-muted">
          Référence de la tentative :{" "}
          <span className="font-[family-name:var(--font-mono)] text-ink">
            {p.reference}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {evenement && statut === "reussie" ? (
            <BtnLink href={`/membre/evenements/${evenement}`} sm>
              <Ticket size={14} /> Voir mes billets
            </BtnLink>
          ) : null}
          <BtnLink href="/membre/cotisations" variant="ghost" sm>
            <ArrowLeft size={14} /> Retour aux cotisations
          </BtnLink>
        </div>
      </Card>
    </>
  );
}
