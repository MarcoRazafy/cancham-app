import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EnTeteAdmin } from "@/components/admin/ui";
import { FormulaireEvenement } from "@/components/forms/FormulaireEvenement";
import { Saillant } from "@/components/ui";
import { getEvent } from "@/lib/queries";

export default async function ModifierEvenement({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = await getEvent(id);
  if (!e) notFound();

  return (
    <>
      <Link
        href={`/admin/evenements/${e.id}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-accent mb-4"
      >
        <ArrowLeft size={14} /> Retour à l’événement
      </Link>
      <EnTeteAdmin
        surtitre="Programme"
        titre={
          <>
            Modifier <Saillant>l’événement</Saillant>
          </>
        }
      >
        {e.titre}
      </EnTeteAdmin>
      <FormulaireEvenement event={e} />
    </>
  );
}
