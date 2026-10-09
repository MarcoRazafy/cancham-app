import { Fragment } from "react";
import { LienImbrique } from "@/components/LienImbrique";

const MOTIF =
  /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/gi;

function nettoyer(brut: string): { lien: string; reste: string } {
  let lien = brut;
  let reste = "";
  while (/[.,;:!?»”’'")\]]$/.test(lien)) {
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
  classeLien?: string;
  dansUnLien?: boolean;
}) {
  if (!texte) return null;

  const morceaux = texte.split(MOTIF);
  return (
    <>
      {morceaux.map((morceau, i) => {
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
