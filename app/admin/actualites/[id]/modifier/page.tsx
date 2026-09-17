import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EnTeteAdmin } from "@/components/admin/ui";
import { FormulaireActualite } from "@/components/forms/AdminContenuForms";
import { Saillant } from "@/components/ui";
import { getNewsItem } from "@/lib/queries";

export default async function ModifierActualite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const n = await getNewsItem(id);
  if (!n) notFound();

  return (
    <>
      <Link
        href={`/admin/actualites/${n.id}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-accent mb-4"
      >
        <ArrowLeft size={14} /> Retour à l’actualité
      </Link>
      <EnTeteAdmin
        surtitre="Programme"
        titre={
          <>
            Modifier <Saillant>l’actualité</Saillant>
          </>
        }
      >
        {n.titre}
      </EnTeteAdmin>
      <FormulaireActualite news={n} />
    </>
  );
}
