import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EnTeteAdmin } from "@/components/admin/ui";
import { FormulaireActualite } from "@/components/forms/AdminContenuForms";
import { Saillant } from "@/components/ui";

export default function NouvelleActualite() {
  return (
    <>
      <Link
        href="/admin/actualites"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-accent mb-4"
      >
        <ArrowLeft size={14} /> Toutes les actualités
      </Link>
      <EnTeteAdmin
        surtitre="Programme"
        titre={
          <>
            Nouvelle <Saillant>actualité</Saillant>
          </>
        }
      >
        Elle apparaît dans le fil des membres dès la publication.
      </EnTeteAdmin>
      <FormulaireActualite />
    </>
  );
}
