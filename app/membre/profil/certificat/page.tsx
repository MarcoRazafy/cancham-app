import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BtnLink } from "@/components/ui";
import { CertificatAdhesion } from "@/components/Certificat";
import { PrintButton } from "@/components/forms/PrintButton";
import { getInvoices, getMember } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { ADHESION_PENDING } from "@/lib/membership";
import {
  dernierReglementCotisation,
  renouvellementCotisation,
} from "@/lib/agenda";

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

  // La période couverte part du dernier règlement — à défaut, de l'adhésion —
  // et court un an, comme le renouvellement annoncé partout ailleurs.
  const factures = await getInvoices(m.id);
  const debut = dernierReglementCotisation(factures) ?? m.adhesion;
  const fin = renouvellementCotisation({
    factures,
    adhesion: m.adhesion,
    aJour: m.statut === "a_jour",
  });

  return (
    <>
      <div className="flex justify-between gap-3 flex-wrap mb-4 no-print">
        <BtnLink href="/membre/profil" variant="ghost" sm>
          <ArrowLeft size={14} /> Retour au profil
        </BtnLink>
        <PrintButton />
      </div>

      {/*
        Le certificat s'imprime seul, en paysage et sans marge de page : le
        navigateur n'a plus où écrire la date, le titre de l'onglet et
        l'adresse. La règle vit ici, pas dans la feuille globale — elle ne
        concerne que cette page.
      */}
      <style>
        {"@media print { @page { size: A4 landscape; margin: 0 } }"}
      </style>

      <CertificatAdhesion membre={m} debut={debut} fin={fin} />
    </>
  );
}
