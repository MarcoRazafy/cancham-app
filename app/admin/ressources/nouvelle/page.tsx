import Link from "next/link";
import { ArrowLeft, FileUp, LayoutTemplate } from "lucide-react";
import { EnTeteAdmin } from "@/components/admin/ui";
import { FormulaireRessource } from "@/components/forms/AdminContenuForms";
import { EditeurPage } from "@/components/ressources/EditeurPage";
import { Saillant } from "@/components/ui";
import { getArborescenceDossiers } from "@/lib/queries";

export default async function NouvelleRessource({
  searchParams,
}: {
  searchParams: Promise<{ dossier?: string; mode?: string }>;
}) {
  const { dossier, mode } = await searchParams;
  const dossiers = await getArborescenceDossiers();
  const fichier = mode === "fichier";
  const suite = dossier ? `&dossier=${encodeURIComponent(dossier)}` : "";

  return (
    <>
      <Link
        href={`/admin/ressources${dossier ? `?dossier=${encodeURIComponent(dossier)}` : ""}`}
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
        actions={
          <Link
            href={`/admin/ressources/nouvelle?mode=${fichier ? "page" : "fichier"}${suite}`}
            className="btn-contour btn-contour-sm no-underline"
          >
            {fichier ? (
              <>
                <LayoutTemplate size={15} /> Composer une page
              </>
            ) : (
              <>
                <FileUp size={15} /> Déposer un fichier
              </>
            )}
          </Link>
        }
      />
      {fichier ? (
        <FormulaireRessource dossiers={dossiers} dossierParDefaut={dossier} />
      ) : (
        <EditeurPage dossiers={dossiers} dossierParDefaut={dossier} />
      )}
    </>
  );
}
