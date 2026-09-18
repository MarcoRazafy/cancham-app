import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BtnLink } from "@/components/ui";
import { CertificatAdhesion } from "@/components/Certificat";
import { PrintButton } from "@/components/forms/PrintButton";
import { getMember } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
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

      <CertificatAdhesion membre={m} />
    </>
  );
}
