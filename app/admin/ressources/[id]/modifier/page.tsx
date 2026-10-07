import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EnTeteAdmin } from "@/components/admin/ui";
import { FormulaireRessource } from "@/components/forms/AdminContenuForms";
import { Saillant } from "@/components/ui";
import { getArborescenceDossiers } from "@/lib/queries";
import { getMembresPourAcces, getRessourcesAdmin } from "@/lib/queries-admin";

export default async function ModifierRessource({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ressources, dossiers, membres] = await Promise.all([
    getRessourcesAdmin(),
    getArborescenceDossiers(),
    getMembresPourAcces(),
  ]);
  const r = ressources.find((x) => x.id === id);
  if (!r) notFound();

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
            Modifier <Saillant>la ressource</Saillant>
          </>
        }
      >
        {r.titre}
      </EnTeteAdmin>
      <FormulaireRessource
        ressource={r}
        dossiers={dossiers}
        membres={membres}
      />
    </>
  );
}
