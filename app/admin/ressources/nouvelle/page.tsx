import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EnTeteAdmin } from "@/components/admin/ui";
import { FormulaireRessource } from "@/components/forms/AdminContenuForms";
import { Saillant } from "@/components/ui";
import { getArborescenceDossiers } from "@/lib/queries";

export default async function NouvelleRessource({
  searchParams,
}: {
  searchParams: Promise<{ dossier?: string }>;
}) {
  const { dossier } = await searchParams;
  const dossiers = await getArborescenceDossiers();
  return (
    <>
      <Link
        href="/admin/ressources"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-accent mb-4"
      >
        <ArrowLeft size={14} /> Bibliothèque
      </Link>
      <EnTeteAdmin
        surtitre="Programme"
        titre={
          <>
            Nouvelle <Saillant>ressource</Saillant>
          </>
        }
      />
      <FormulaireRessource dossiers={dossiers} dossierParDefaut={dossier} />
    </>
  );
}
