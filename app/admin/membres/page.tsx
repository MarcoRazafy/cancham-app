import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Saillant,
  StatusPill,
  TableWrap,
  Td,
  Th,
  ViewHead,
} from "@/components/ui";
import { AddMemberButton } from "@/components/forms/MemberForms";
import { getMembers } from "@/lib/queries";
import { fmtDateShort } from "@/lib/format";
import type { MemberStatus } from "@/lib/types";

const TABS: { key: string; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "a_jour", label: "À jour" },
  { key: "en_attente", label: "En attente de paiement" },
  { key: "en_retard", label: "En retard" },
  { key: "candidature", label: "Nouvelles demandes" },
];

export default async function AdminMembres({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ tab = "tous" }, membres] = await Promise.all([
    searchParams,
    getMembers(),
  ]);
  const list = membres.filter((m) => tab === "tous" || m.statut === tab);

  return (
    <>
      <ViewHead
        title={<>Gestion des {<Saillant>membres</Saillant>}</>}
        action={<AddMemberButton />}
      >
        {membres.length} entreprises. Voyez qui n’est pas à jour de cotisation,
        validez les nouvelles demandes ou ajoutez un membre manuellement.
      </ViewHead>

      <div className="flex gap-1 border-b border-line mb-[18px] flex-wrap">
        {TABS.map((t) => {
          const count =
            t.key === "tous"
              ? null
              : membres.filter((m) => m.statut === (t.key as MemberStatus))
                  .length;
          return (
            <Link
              key={t.key}
              href={`/admin/membres?tab=${t.key}`}
              className={`px-1 py-2.5 mr-[18px] text-[13.5px] font-semibold no-underline border-b-2 ${
                tab === t.key
                  ? "text-accent border-accent"
                  : "text-faint border-transparent hover:text-ink"
              }`}
            >
              {t.label}
              {count !== null ? ` (${count})` : ""}
            </Link>
          );
        })}
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Entreprise</Th>
            <Th>Secteur</Th>
            <Th>Ville</Th>
            <Th>Adhésion</Th>
            <Th>Statut</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {list.length ? (
            list.map((m) => (
              <tr key={m.id} className="hover:bg-surface-2">
                <Td className="font-semibold">{m.nom}</Td>
                <Td className="text-muted">{m.secteur}</Td>
                <Td className="text-muted">{m.ville}</Td>
                <Td className="text-muted">{fmtDateShort(m.adhesion)}</Td>
                <Td>
                  <StatusPill status={m.statut} />
                </Td>
                <Td>
                  <Link
                    href={`/admin/membres/${m.id}`}
                    className="inline-flex items-center gap-1.5 text-[12.4px] font-semibold text-muted hover:text-ink no-underline"
                  >
                    Gérer <ChevronRight size={13} />
                  </Link>
                </Td>
              </tr>
            ))
          ) : (
            <tr>
              <Td className="text-muted text-center py-6">
                Aucun membre dans cette catégorie.
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>
    </>
  );
}
