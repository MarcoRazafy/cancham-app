import Link from "next/link";
import { AlertTriangle, Pencil, Plus } from "lucide-react";
import { SupprimerRessourceButton } from "@/components/forms/AdminContenuForms";
import { ResourceCard } from "@/components/domain";
import { EmptyState, ViewHead } from "@/components/ui";
import { DownloadResourceButton } from "@/components/forms/ContentForms";
import { getResourceCounts, getResources } from "@/lib/queries";
import type { Space } from "@/lib/types";

type Filtre = "tout" | "gratuit" | "payant";

const TABS: { key: Filtre; label: string }[] = [
  { key: "tout", label: "Tout" },
  { key: "gratuit", label: "Gratuit" },
  { key: "payant", label: "Payant" },
];

export async function RessourcesPage({
  space,
  type = "tout",
}: {
  space: Space;
  type?: string;
}) {
  const admin = space === "admin";
  const actif: Filtre = type === "gratuit" || type === "payant" ? type : "tout";

  const [list, counts] = await Promise.all([
    getResources(actif === "tout" ? undefined : actif),
    getResourceCounts(),
  ]);

  return (
    <>
      <ViewHead
        title="Ressources"
        action={
          admin ? (
            <Link
              href="/admin/ressources/nouvelle"
              className="btn-action btn-action-sm no-underline"
            >
              <Plus size={15} /> Nouvelle ressource
            </Link>
          ) : null
        }
      >
        Documents, modèles et formations mis à disposition des membres. Certains
        livrables de fond sont facturés en supplément de la cotisation.
      </ViewHead>

      <div className="flex gap-1 border-b border-line mb-[18px] flex-wrap">
        {TABS.map((t) => {
          const count = counts[t.key];
          return (
            <Link
              key={t.key}
              href={`/${space}/ressources?type=${t.key}`}
              className={`px-1 py-2.5 mr-[18px] text-[13.5px] font-semibold no-underline border-b-2 ${
                actif === t.key
                  ? "text-accent border-accent"
                  : "text-faint border-transparent hover:text-ink"
              }`}
            >
              {t.label} ({count})
            </Link>
          );
        })}
      </div>

      {list.length ? (
        <div className="cascade grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              footer={
                admin ? (
                  <div className="w-full flex items-center gap-1.5">
                    {r.pret ? (
                      r.type === "gratuit" ? (
                        <DownloadResourceButton
                          resourceId={r.id}
                          space={space}
                          payant={false}
                          video={r.fmt === "Vidéo"}
                        />
                      ) : (
                        <span className="flex-1 text-[12px] text-success-strong font-semibold">
                          Fichier prêt
                        </span>
                      )
                    ) : (
                      <span className="flex-1 inline-flex items-center gap-1 text-[12px] text-accent font-semibold">
                        <AlertTriangle size={13} /> Fichier manquant
                      </span>
                    )}
                    <Link
                      href={`/admin/ressources/${r.id}/modifier`}
                      aria-label={`Modifier « ${r.titre} »`}
                      title="Modifier"
                      className="w-9 h-9 shrink-0 rounded-[var(--radius-s)] border border-line bg-surface flex items-center justify-center text-muted hover:text-ink hover:border-faint"
                    >
                      <Pencil size={15} />
                    </Link>
                    <SupprimerRessourceButton
                      resourceId={r.id}
                      titre={r.titre}
                    />
                  </div>
                ) : (
                  <div className="w-full flex flex-col gap-1.5">
                    <DownloadResourceButton
                      resourceId={r.id}
                      space={space}
                      payant={r.type === "payant"}
                      video={r.fmt === "Vidéo"}
                    />
                  </div>
                )
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState>Aucune ressource dans cette catégorie.</EmptyState>
      )}
    </>
  );
}
