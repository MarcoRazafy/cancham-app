import Link from "next/link";
import { House, SearchX } from "lucide-react";
import { Incident } from "@/components/Incident";

/** Page introuvable : lien mort, fiche supprimée, adresse mal recopiée. */
export function IncidentIntrouvable({
  accueil,
  pleinEcran = false,
}: {
  accueil: string;
  pleinEcran?: boolean;
}) {
  return (
    <Incident
      pleinEcran={pleinEcran}
      icone={<SearchX size={24} />}
      surtitre="Erreur 404"
      titre="Page introuvable"
      actions={
        <Link href={accueil} className="btn-action btn-action-sm no-underline">
          <House size={15} aria-hidden /> Retour à l’accueil
        </Link>
      }
    >
      <p className="m-0">
        Cette page n’existe pas, ou plus : le lien est peut-être ancien, ou ce
        qu’il montrait a été retiré.
      </p>
    </Incident>
  );
}
