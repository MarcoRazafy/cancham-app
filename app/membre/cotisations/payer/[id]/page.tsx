import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { Banner, ViewHead } from "@/components/ui";
import {
  AnnonceReglement,
  TunnelReglement,
} from "@/components/paiement/TunnelReglement";
import { TunnelPortefeuille } from "@/components/paiement/TunnelPortefeuille";
import { prisma } from "@/lib/db";
import {
  estPortefeuilleConnu,
  getCoordonneesPaiement,
  MODES,
  numeroPortefeuille,
} from "@/lib/reglements";
import { getCurrentUser } from "@/lib/session";

/**
 * Le tunnel d'un règlement : où envoyer l'argent, et la référence à recopier.
 *
 * On y revient autant qu'on veut — « je le ferai plus tard » ne perd rien,
 * la référence est celle du règlement ouvert.
 *
 * Les portefeuilles mobiles ont leur propre écran, aux couleurs de
 * l'opérateur : on y paie depuis son téléphone, en trois gestes annoncés.
 */
export default async function PageReglement({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ numero?: string }>;
}) {
  const { id } = await params;
  const { numero } = await searchParams;
  const user = await getCurrentUser("membre");

  const p = await prisma.paiement.findUnique({
    where: { id },
    include: {
      invoice: { select: { numero: true, objet: true } },
      member: { select: { nom: true } },
    },
  });
  if (!p || !user.memberId || p.memberId !== user.memberId) notFound();

  const c = await getCoordonneesPaiement();
  const objet = p.invoice
    ? `${p.invoice.objet} · facture ${p.invoice.numero}`
    : "Règlement";
  // Revenir en arrière, c'est rouvrir le choix du moyen pour cette facture.
  const retour = p.invoiceId
    ? `/membre/cotisations?regler=${p.invoiceId}`
    : "/membre/cotisations";

  if (estPortefeuilleConnu(p.mode)) {
    // Le numéro du membre, posé à l'étape 1 et gardé dans le détail du
    // règlement : revenir sur la page ne le fait pas resaisir.
    const detail = (p.detail ?? {}) as { telephone?: unknown };
    const telephone =
      typeof detail.telephone === "string" ? detail.telephone : null;

    return (
      <TunnelPortefeuille
        mode={p.mode}
        reglementId={p.id}
        reference={p.reference}
        montant={p.montant}
        devise={p.devise}
        objet={p.invoice?.objet ?? "Règlement"}
        titulaire={c.titulaire}
        numeroChambre={numeroPortefeuille(p.mode, c)}
        telephone={telephone}
        statut={p.statut}
        modifier={numero === "modifier"}
        retour={retour}
      />
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href={retour}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-accent"
        >
          <ArrowLeft size={14} /> Changer de moyen
        </Link>
      </div>

      <ViewHead title={MODES[p.mode].titre}>
        Règlement{" "}
        <span className="font-[family-name:var(--font-mono)] text-ink">
          {p.reference}
        </span>
      </ViewHead>

      {p.statut === "reussie" ? (
        <Banner
          tone="ok"
          icon={<CheckCircle2 size={18} />}
          title="Règlement encaissé"
        >
          L’équipe a confirmé la réception. Il n’y a plus rien à faire.
        </Banner>
      ) : p.statut === "annonce" ? (
        <Banner
          tone="warn"
          icon={<Clock size={18} />}
          title="En attente de confirmation"
        >
          Vous avez annoncé ce règlement. L’équipe le confirmera dès qu’elle
          aura constaté l’arrivée de l’argent.
        </Banner>
      ) : null}

      <div className="mt-4">
        <TunnelReglement
          mode={p.mode}
          reference={p.reference}
          montant={p.montant}
          devise={p.devise}
          coordonnees={c}
          objet={objet}
          payeur={p.member?.nom ?? ""}
        />
      </div>

      {p.statut === "en_cours" ? (
        <AnnonceReglement reglementId={p.id} mode={p.mode} />
      ) : null}
    </>
  );
}
