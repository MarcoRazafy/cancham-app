import Image from "next/image";
import { ProtectionDocument } from "@/components/ProtectionDocument";
import { COORDONNEES } from "@/lib/coordonnees";
import { fmtDate } from "@/lib/format";
import { libelleFormule } from "@/lib/membership";
import { affichageSite } from "@/lib/liens";
import type { Member } from "@/lib/types";

/**
 * Hammersmith One, la fonte des titres de la charte.
 *
 * Le certificat s'affiche dans l'espace membre, dont les règles font passer
 * tous les titres sur Inter 700 : écrites après celles de `.marque` et de même
 * poids, elles l'emportent. Les `!` les repassent devant — un document
 * officiel de la chambre suit la charte, pas l'outil de travail qui l'affiche.
 * Et Hammersmith One n'existe qu'en graisse 400 : la demander en gras ferait
 * fabriquer un faux gras au navigateur.
 */
const TITRE_CHARTE =
  "font-[family-name:var(--font-titre)]! font-normal! tracking-[-0.005em]";

/**
 * Certificat d'adhésion, tel qu'il s'imprime.
 *
 * Une feuille A4 posée à l'italienne : ce qu'on voit à l'écran a exactement
 * les proportions de ce qui sortira de l'imprimante. Les tailles sont
 * exprimées en `cqw` — un pourcentage de la largeur de la feuille —, si bien
 * que le document se lit pareil dans une fenêtre de 900 pixels et sur 297
 * millimètres de papier. Le `@container` est donc posé sur l'enveloppe, et
 * non sur la feuille : une unité `cqw` se mesure sur un conteneur ancêtre,
 * jamais sur l'élément qui la porte.
 *
 * La feuille porte la classe `marque` : un document officiel de la chambre
 * suit sa charte, et non les polices de l'espace membre, qui n'est qu'un
 * outil de travail.
 *
 * Elle est enveloppée dans `ProtectionDocument` : ni sélection, ni copie, ni
 * « Enregistrer l'image sous… ». L'impression reste entière — c'est l'usage
 * prévu.
 *
 * Partagé par la fenêtre ouverte depuis « Mon entreprise » et par la page
 * d'impression.
 */
export function CertificatAdhesion({
  membre: m,
  fin,
}: {
  membre: Pick<Member, "nom" | "formule">;
  /** Fin de la période couverte, ISO court. Absente, la mention s'efface. */
  fin?: string | null;
}) {
  return (
    <ProtectionDocument className="mx-auto w-full max-w-[1000px] print:max-w-none">
      <div className="@container aspect-[297/210] w-full print:h-[210mm] print:w-[297mm]">
        {/*
          Le cadre en dégradé, du rouge au vert : les deux couleurs de la
          charte se rejoignent sur la tranche du document, comme les deux pays.
        */}
        <div className="certificat flex h-full w-full bg-[linear-gradient(100deg,#ad0707_0%,#7a4a1f_52%,#007140_100%)] p-[1.1cqw]">
          {/*
            `marque` va sur la feuille et non sur le cadre : la charte pose un
            fond blanc, écrit hors des couches de Tailwind, qui l'emporte donc
            sur une classe utilitaire — le dégradé du cadre disparaîtrait.
          */}
          <div className="marque flex h-full w-full bg-white p-[1.2cqw]">
            <div className="flex h-full w-full flex-col items-center border border-[#0f1d2c]/20 px-[5cqw] py-[2.6cqw] text-center text-[#0f1d2c]">
              <Image
                src="/marque/sigle.png"
                alt="CanCham — Chambre de Commerce et de Coopération Canada-Madagascar"
                width={1888}
                height={1159}
                sizes="260px"
                draggable={false}
                className="h-auto w-[13.5cqw]"
              />

              <h1
                className={`${TITRE_CHARTE} m-0 mt-[1.9cqw] text-[5.4cqw] leading-none text-[#ad0707]`}
              >
                Certificat d’adhésion
              </h1>

              <p className="m-0 mt-[2.1cqw] max-w-[68cqw] text-[1.7cqw] leading-relaxed text-[#243447]">
                La Chambre de Commerce et de Coopération Canada-Madagascar
                atteste que
              </p>

              <div className="mt-[1.7cqw] w-[64cqw] max-w-full">
                <div
                  className={`${TITRE_CHARTE} text-[3.8cqw] leading-tight break-words`}
                >
                  {m.nom}
                </div>
                <span
                  aria-hidden
                  className="mt-[0.9cqw] block h-[0.25cqw] w-full rounded-full bg-[linear-gradient(90deg,#ad0707,#007140)]"
                />
              </div>

              <p className="m-0 mt-[2.1cqw] max-w-[68cqw] text-[1.7cqw] leading-relaxed text-[#243447]">
                est membre de la CanCham Madagascar
                {/*
                  Sans formule choisie, la phrase saute la catégorie : en
                  inventer une sur un document officiel serait pire que de n'en
                  pas mettre.
                */}
                {m.formule ? (
                  <>
                    {" "}
                    au titre de la catégorie{" "}
                    <b className="font-semibold text-[#0f1d2c]">
                      {libelleFormule(m.formule)}
                    </b>
                  </>
                ) : null}
                , et bénéficie à ce titre de l’ensemble des avantages réservés
                aux membres.
              </p>

              {/* La validité à gauche, le sceau au centre, la signature à droite. */}
              <div className="mt-auto grid w-full grid-cols-3 items-end gap-[2cqw]">
                <div className="text-left">
                  {fin ? (
                    <>
                      <div className="text-[1.05cqw] font-semibold uppercase tracking-[0.16em] text-[#4a5a6b]">
                        Valable jusqu’au
                      </div>
                      <div
                        className={`${TITRE_CHARTE} mt-[0.5cqw] text-[2.1cqw] leading-none text-[#ad0707]`}
                      >
                        {fmtDate(fin)}
                      </div>
                    </>
                  ) : null}
                </div>

                <SceauMembre className="mx-auto w-[9.5cqw]" />

                <div className="text-right">
                  {/*
                    La signature repose sur le trait, comme à la main : elle
                    déborde d'un cheveu dessus plutôt que de flotter au-dessus.
                  */}
                  <Image
                    src="/marque/signature-presidente.png"
                    alt="Signature de la présidente du Conseil d’Administration"
                    width={395}
                    height={292}
                    sizes="220px"
                    draggable={false}
                    className="ml-auto -mb-[1cqw] h-auto w-[13cqw]"
                  />
                  <span
                    aria-hidden
                    className="ml-auto block h-px w-[21cqw] max-w-full bg-[#0f1d2c]/60"
                  />
                  <div className="mt-[0.7cqw] text-[1.5cqw] font-semibold leading-snug">
                    Ando Lalaina RATOVOMANANA
                  </div>
                  <div className="text-[1.25cqw] leading-snug text-[#4a5a6b]">
                    Présidente du Conseil d’Administration
                  </div>
                </div>
              </div>

              <div className="mt-[1.5cqw] text-[1.15cqw] text-[#4a5a6b]">
                Le présent certificat est délivré pour servir et valoir ce que
                de droit. · {affichageSite(COORDONNEES.site)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectionDocument>
  );
}

/**
 * Le sceau de la chambre, dessiné et non photographié.
 *
 * En vectoriel, il reste net à l'impression quelle que soit la taille du
 * papier, et il n'y a pas d'image à aller chercher — ni à enregistrer d'un
 * clic droit. L'anneau porte la mention qui tourne, le disque vert la coche.
 */
function SceauMembre({ className }: { className?: string }) {
  const rayon = 39;
  const tour = 2 * Math.PI * rayon;

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Sceau : membre officiel de la CanCham Madagascar"
      className={`h-auto ${className ?? ""}`}
    >
      <defs>
        <path
          id="sceau-anneau"
          fill="none"
          d={`M 50 ${50 - rayon} A ${rayon} ${rayon} 0 1 1 49.99 ${50 - rayon}`}
        />
      </defs>

      <circle cx="50" cy="50" r="49" fill="#8b0a1f" />
      <circle
        cx="50"
        cy="50"
        r="33.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1"
        opacity="0.45"
      />
      <circle cx="50" cy="50" r="30" fill="#007140" />

      <text
        fill="#ffffff"
        fontSize="7"
        fontWeight="700"
        letterSpacing="0.04em"
        fontFamily="var(--font-texte)"
      >
        <textPath
          href="#sceau-anneau"
          startOffset="0"
          textLength={tour}
          lengthAdjust="spacing"
        >
          MEMBRE OFFICIEL · CANCHAM MADAGASCAR ·
        </textPath>
      </text>

      <path
        d="M37 50.5 L46 59.5 L64 39.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
