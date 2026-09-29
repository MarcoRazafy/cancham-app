import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { Banner, ViewHead } from "@/components/ui";
import {
  AnnonceReglement,
  TunnelReglement,
} from "@/components/paiement/TunnelReglement";
import { TunnelCarte } from "@/components/paiement/TunnelCarte";
import { TunnelPortefeuille } from "@/components/paiement/TunnelPortefeuille";
import type { PropsReglement } from "@/components/paiement/tunnels/commun";
import { TunnelDepot } from "@/components/paiement/tunnels/Depot";
import { TunnelEspeces } from "@/components/paiement/tunnels/Especes";
import { TunnelVirement } from "@/components/paiement/tunnels/Virement";
import { prisma } from "@/lib/db";
import {
  estPortefeuilleConnu,
  getCoordonneesPaiement,
  MODES,
  numeroPortefeuille,
} from "@/lib/reglements";
import { aujourdhuiISO } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { vanillaPayActif } from "@/lib/vanillapay";

/**
 * Le tunnel d'un règlement : où envoyer l'argent, et la référence à recopier.
 *
 * On y revient autant qu'on veut — « je le ferai plus tard » ne perd rien,
 * la référence est celle du règlement ouvert.
 *
 * Chaque moyen a son écran, repris de sa maquette : les portefeuilles aux
 * couleurs de l'opérateur, la carte, le virement et son RIB, le dépôt et son
 * bordereau, les espèces et leur bon de remise. Seules les plateformes
 * tierces gardent l'écran commun.
 */
export default async function PageReglement({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ numero?: string; etape?: string; modifier?: string }>;
}) {
  const { id } = await params;
  const { numero, etape, modifier } = await searchParams;
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

  // Ce que le membre a déjà saisi pour ce règlement : un rendez-vous, un
  // numéro, le nom du titulaire.
  const detail = (
    p.detail && typeof p.detail === "object" && !Array.isArray(p.detail)
      ? p.detail
      : {}
  ) as Record<string, unknown>;

  if (p.mode === "carte") {
    return (
      <TunnelCarte
        reglementId={p.id}
        montant={p.montant}
        devise={p.devise}
        objet={p.invoice?.objet ?? "Règlement"}
        titulaire={
          typeof detail.titulaire === "string" ? detail.titulaire : user.nom
        }
        statut={p.statut}
        raccorde={vanillaPayActif()}
        retour={retour}
      />
    );
  }

  if (p.mode === "virement" || p.mode === "depot" || p.mode === "especes") {
    const commun: PropsReglement = {
      reglementId: p.id,
      reference: p.reference,
      montant: p.montant,
      devise: p.devise,
      objet: p.invoice?.objet ?? "Règlement",
      numeroFacture: p.invoice?.numero ?? null,
      statut: p.statut,
      retour,
      etape,
      coordonnees: c,
      payeur: p.member?.nom ?? "",
      personne: user.nom,
      detail,
      aujourdhui: aujourdhuiISO(),
    };
    if (p.mode === "virement") return <TunnelVirement {...commun} />;
    if (p.mode === "depot") return <TunnelDepot {...commun} />;
    return <TunnelEspeces {...commun} modifier={modifier === "1"} />;
  }

  if (estPortefeuilleConnu(p.mode)) {
    // Le numéro du membre, posé à l'étape 1 et gardé dans le détail du
    // règlement : revenir sur la page ne le fait pas resaisir.
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
