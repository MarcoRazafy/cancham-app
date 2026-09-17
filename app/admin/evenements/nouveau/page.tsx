import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EnTeteAdmin } from "@/components/admin/ui";
import { FormulaireEvenement } from "@/components/forms/FormulaireEvenement";
import { Saillant } from "@/components/ui";

export default function NouvelEvenement() {
  return (
    <>
      <Link
        href="/admin/evenements"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-accent mb-4"
      >
        <ArrowLeft size={14} /> Tous les événements
      </Link>
      <EnTeteAdmin
        surtitre="Programme"
        titre={
          <>
            Nouvel <Saillant>événement</Saillant>
          </>
        }
      >
        Il est publié aux membres dès l’enregistrement, et les inscriptions
        s’ouvrent aussitôt.
      </EnTeteAdmin>
      <FormulaireEvenement />
    </>
  );
}
