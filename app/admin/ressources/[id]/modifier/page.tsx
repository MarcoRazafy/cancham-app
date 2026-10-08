import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EnTeteAdmin } from "@/components/admin/ui";
import { FormulaireRessource } from "@/components/forms/AdminContenuForms";
import { EditeurPage } from "@/components/ressources/EditeurPage";
import { Saillant } from "@/components/ui";
import { getArborescenceDossiers } from "@/lib/queries";
import { getBlocsRessource, getRessourcesAdmin } from "@/lib/queries-admin";

export default async function ModifierRessource({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ressources, dossiers] = await Promise.all([
    getRessourcesAdmin(),
    getArborescenceDossiers(),
  ]);
  const r = ressources.find((x) => x.id === id);
  if (!r) notFound();
  // Une page composée se rouvre dans l'éditeur ; un fichier, dans son formulaire.
  const blocs = r.fmt === "page" ? await getBlocsRessource(id) : null;

  return (
    <>
      <Link
        href={`/admin/ressources${r.dossierId ? `?dossier=${r.dossierId}` : ""}`}
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
      {blocs ? (
        <EditeurPage
          ressource={{
            id: r.id,
            titre: r.titre,
            description: r.description,
            cat: r.cat,
            type: r.type,
            prix: r.prix,
            cover: r.cover,
            dossierId: r.dossierId,
            blocs,
          }}
          dossiers={dossiers}
        />
      ) : (
        <FormulaireRessource ressource={r} dossiers={dossiers} />
      )}
    </>
  );
}
