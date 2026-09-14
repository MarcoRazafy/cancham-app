import { notFound } from "next/navigation";
import { ArrowLeft, Award } from "lucide-react";
import { BtnLink, Card } from "@/components/ui";
import { PrintButton } from "@/components/forms/PrintButton";
import { getMember } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { fmtDate, statusLabel } from "@/lib/format";
import { ADHESION_PENDING } from "@/lib/membership";

/**
 * Certificat d'adhésion.
 *
 * Il n'y a pas de génération de PDF : la page est conçue pour l'impression, et
 * le navigateur se charge de l'export. C'est suffisant, gratuit, et ça évite
 * d'embarquer un moteur de rendu côté serveur.
 */
export default async function CertificatPage() {
  const user = await getCurrentUser("membre");
  const m = user.memberId ? await getMember(user.memberId) : null;
  if (!m) notFound();
  if (ADHESION_PENDING.includes(m.statut)) notFound();

  return (
    <>
      <div className="flex justify-between gap-3 flex-wrap mb-4 no-print">
        <BtnLink href="/membre/profil" variant="ghost" sm>
          <ArrowLeft size={14} /> Retour au profil
        </BtnLink>
        <PrintButton />
      </div>

      <Card className="p-0 max-w-[720px] mx-auto">
        <div className="relative border-2 border-navy rounded-[14px] m-2 px-8 py-9 text-center">
          <div
            className="absolute inset-2 border border-accent rounded-[9px] opacity-40 pointer-events-none"
            aria-hidden="true"
          />
          <div className="w-[74px] h-[74px] mx-auto mb-3.5 rounded-full border-2 border-navy text-navy flex items-center justify-center">
            <Award size={30} />
          </div>
          <span className="text-[11.3px] font-bold tracking-[0.09em] uppercase text-accent">
            CanCham Madagascar
          </span>
          <h1 className="text-[22px] m-0 mt-1 mb-1">Certificat d’adhésion</h1>
          <div className="text-[12.8px] text-muted mb-4">
            Chambre de Commerce et de Coopération Canada–Madagascar
          </div>

          <div className="text-[13px] text-muted">Ce certificat atteste que</div>
          <div className="font-[family-name:var(--font-display)] text-[26px] font-semibold my-3.5">
            {m.nom}
          </div>
          <div className="text-[12.8px] text-muted mb-5">
            est membre en règle de la chambre depuis le {fmtDate(m.adhesion)}
          </div>

          <div className="flex justify-between items-end text-left text-[11.8px] text-muted mt-7 gap-6 flex-wrap">
            <div>
              Statut
              <br />
              <b className="block text-ink text-[13px] font-[family-name:var(--font-display)]">
                {statusLabel(m.statut)}
              </b>
            </div>
            <div className="text-right">
              Ando Lalaina Ratovomanana
              <br />
              <b className="block text-ink text-[13px] font-[family-name:var(--font-display)]">
                Présidente du Conseil d’Administration
              </b>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
