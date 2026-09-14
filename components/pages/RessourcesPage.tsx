import Link from "next/link";
import { ResourceCard } from "@/components/domain";
import { EmptyState, ViewHead } from "@/components/ui";
import {
  DeleteResourceButton,
  DownloadResourceButton,
  NewResourceButton,
} from "@/components/forms/ContentForms";
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
  const actif: Filtre =
    type === "gratuit" || type === "payant" ? type : "tout";

  const [list, counts] = await Promise.all([
    getResources(actif === "tout" ? undefined : actif),
    getResourceCounts(),
  ]);

  return (
    <>
      <ViewHead
        title="Ressources"
        action={admin ? <NewResourceButton /> : null}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              footer={
                <div className="w-full flex flex-col gap-1.5">
                  <DownloadResourceButton
                    resourceId={r.id}
                    space={space}
                    payant={r.type === "payant"}
                    video={r.fmt === "Vidéo"}
                  />
                  {admin ? <DeleteResourceButton resourceId={r.id} /> : null}
                </div>
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
