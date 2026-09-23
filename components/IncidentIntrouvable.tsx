import Image from "next/image";
import Link from "next/link";
import { House } from "lucide-react";
import { Incident } from "@/components/Incident";

/**
 * Page introuvable : lien mort, fiche supprimée, adresse mal recopiée.
 *
 * L'illustration porte déjà le « 404 » et les couleurs de la chambre : elle
 * remplace la pastille, et reste décorative pour les lecteurs d'écran — le
 * titre dit la même chose, en mots.
 */
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
      illustration={
        <Image
          src="/marque/illustration-404.png"
          alt=""
          width={880}
          height={914}
          priority
          sizes="(max-width: 460px) 64vw, 280px"
          className="mx-auto w-[min(280px,64vw)] h-auto"
        />
      }
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
