import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EnTeteAdmin } from "@/components/admin/ui";
import { FormulaireRessource } from "@/components/forms/AdminContenuForms";
import { Saillant } from "@/components/ui";

export default function NouvelleRessource() {
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
      >
        Elle apparaît dans la bibliothèque des membres dès que son fichier est
        prêt.
      </EnTeteAdmin>
      <FormulaireRessource />
    </>
  );
}
