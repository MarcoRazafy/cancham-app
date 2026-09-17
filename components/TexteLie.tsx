import { Fragment } from "react";
import { LienImbrique } from "@/components/LienImbrique";

/**
 * Texte libre dont les adresses deviennent cliquables.
 *
 * Partout où un membre ou l'équipe écrit — message, commentaire, publication,
 * offre, service, fiche, événement —, un lien collé dans le texte s'ouvre d'un
 * clic au lieu de devoir être recopié. Sont reconnus : `https://…`, `www.…`
 * et les adresses courriel.
 *
 * Seuls `http`, `https` et `mailto` sont produits. Un texte qui contient
 * « javascript:… » reste du texte : un lien piégé posé dans un message
 * s'exécuterait chez chaque destinataire qui clique.
 */

const MOTIF =
  /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/gi;

/** Ponctuation de fin de phrase, qui colle au lien sans en faire partie. */
function nettoyer(brut: string): { lien: string; reste: string } {
  let lien = brut;
  let reste = "";
  while (/[.,;:!?»”’'")\]]$/.test(lien)) {
    // Une parenthèse fermante fait partie du lien si elle en ferme une autre,
    // comme dans les adresses de Wikipédia.
    if (
      lien.endsWith(")") &&
      (lien.match(/\(/g)?.length ?? 0) >= (lien.match(/\)/g)?.length ?? 0)
    )
      break;
    reste = lien.slice(-1) + reste;
    lien = lien.slice(0, -1);
  }
  return { lien, reste };
}

function cible(lien: string): string {
  if (
    lien.includes("@") &&
    !/^https?:\/\//i.test(lien) &&
    !lien.startsWith("www.")
  ) {
    return `mailto:${lien}`;
  }
  return /^https?:\/\//i.test(lien) ? lien : `https://${lien}`;
}

/** Une adresse trop longue est raccourcie à l'affichage, jamais dans le lien. */
function libelle(lien: string): string {
  const court = lien.replace(/^https?:\/\//i, "");
  return court.length > 60 ? `${court.slice(0, 57)}…` : court;
}

export function TexteLie({
  texte,
  classeLien = "text-accent underline underline-offset-2 decoration-accent/40 hover:decoration-accent [overflow-wrap:anywhere]",
  dansUnLien = false,
}: {
  texte: string | null | undefined;
  /** Style des liens : à adapter sur fond coloré, une bulle rouge par exemple. */
  classeLien?: string;
  /** Le texte est déjà dans une carte cliquable : pas de `<a>` imbriqué. */
  dansUnLien?: boolean;
}) {
  if (!texte) return null;

  const morceaux = texte.split(MOTIF);
  return (
    <>
      {morceaux.map((morceau, i) => {
        // `split` avec un groupe capturant alterne texte et correspondances.
        if (i % 2 === 0) return <Fragment key={i}>{morceau}</Fragment>;

        const { lien, reste } = nettoyer(morceau);
        const href = cible(lien);
        const courriel = href.startsWith("mailto:");

        return (
          <Fragment key={i}>
            {dansUnLien ? (
              <LienImbrique href={href} className={classeLien}>
                {libelle(lien)}
              </LienImbrique>
            ) : (
              <a
                href={href}
                {...(courriel ? {} : { target: "_blank" })}
                // `nofollow ugc` : ces liens sont écrits par des utilisateurs.
                rel="noopener noreferrer nofollow ugc"
                className={classeLien}
              >
                {libelle(lien)}
              </a>
            )}
            {reste}
          </Fragment>
        );
      })}
    </>
  );
}
