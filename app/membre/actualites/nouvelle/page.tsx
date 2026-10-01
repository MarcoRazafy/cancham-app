import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormulaireActualiteMembre } from "@/components/forms/AdminContenuForms";
import { ViewHead } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";

/**
 * Un membre publie une actualité au nom de son entreprise.
 *
 * Elle paraît aussitôt dans le fil des membres — jamais sur la page
 * publique, qui reste à la chambre. L'équipe peut ensuite la modifier ou la
 * retirer : la page le dit, pour que personne ne s'en étonne.
 */
export default async function NouvelleActualiteMembre() {
  await getCurrentUser("membre");
  return (
    <>
      <Link
        href="/membre/actualites"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-accent"
      >
        <ArrowLeft size={14} /> Toutes les actualités
      </Link>
      <ViewHead title="Publier une actualité">
        Une nouvelle de votre entreprise à partager avec le réseau : elle
        paraît dans le fil des membres, à votre nom. L’équipe CanCham peut la
        modifier ou la retirer.
      </ViewHead>
      <FormulaireActualiteMembre />
    </>
  );
}
