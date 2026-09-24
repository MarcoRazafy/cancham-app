import Image from "next/image";
import { COORDONNEES } from "@/lib/coordonnees";
import { fmtDate } from "@/lib/format";
import type { Member } from "@/lib/types";

/**
 * Certificat d'adhésion, tel qu'il s'imprime.
 *
 * Une feuille A4 posée à l'italienne : ce qu'on voit à l'écran a exactement
 * les proportions de ce qui sortira de l'imprimante. Les tailles sont
 * exprimées en `cqw` — un pourcentage de la largeur de la feuille —, si bien
 * que le document se lit pareil dans une fenêtre de 900 pixels et sur 297
 * millimètres de papier.
 *
 * Partagé par la fenêtre ouverte depuis « Mon entreprise » et par la page
 * d'impression.
 */
export function CertificatAdhesion({
  membre: m,
  debut,
  fin,
}: {
  membre: Pick<Member, "nom" | "adhesion">;
  /** Début de la période couverte, ISO court. Par défaut, l'adhésion. */
  debut?: string | null;
  /** Fin de la période, ISO court. Absente, la mention s'efface. */
  fin?: string | null;
}) {
  const du = debut ?? m.adhesion;

  return (
    <div className="mx-auto w-full max-w-[1000px] print:max-w-none">
      <div className="certificat @container relative aspect-[297/210] w-full overflow-hidden rounded-[10px] border border-line bg-white text-[#0f1d2c] print:h-[210mm] print:w-[297mm] print:rounded-none print:border-0">
        {/* Les deux couleurs de la charte, en équerre. */}
        <span
          aria-hidden
          className="absolute left-0 top-0 h-[0.8cqw] w-[42%] bg-[#ad0707]"
        />
        <span
          aria-hidden
          className="absolute right-0 top-0 h-[0.8cqw] w-[16%] bg-[#007140]"
        />
        <span
          aria-hidden
          className="absolute bottom-0 right-0 h-[0.8cqw] w-[42%] bg-[#007140]"
        />
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-[0.8cqw] w-[16%] bg-[#ad0707]"
        />

        {/*
          Le sigle en filigrane, et non le logo complet : ses deux lignes de
          texte, même très pâles, se lisaient par-dessus celui du certificat.
        */}
        <Image
          src="/marque/sigle.png"
          alt=""
          aria-hidden
          width={1888}
          height={1159}
          sizes="700px"
          className="pointer-events-none absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2 opacity-[0.055]"
        />

        <div className="relative flex h-full flex-col items-center px-[7cqw] py-[4cqw] text-center">
          <Image
            src="/marque/logo-vertical.png"
            alt="CanCham — Chambre de Commerce et de Coopération Canada-Madagascar"
            width={760}
            height={547}
            sizes="220px"
            className="h-auto w-[13cqw]"
          />

          <h1 className="m-0 mt-[2cqw] text-[4.4cqw] font-bold leading-none">
            Certificat d’adhésion
          </h1>

          <p className="m-0 mt-[2.4cqw] max-w-[62cqw] text-[1.6cqw] leading-relaxed text-[#243447]">
            La Chambre de Commerce et de Coopération Canada Madagascar (CanCham
            Madagascar) certifie par la présente que :
          </p>

          <div className="mt-[2.2cqw] w-[62cqw] max-w-full">
            <div className="text-[3.2cqw] font-bold leading-tight break-words">
              {m.nom}
            </div>
            <div
              aria-hidden
              className="mt-[1cqw] h-px w-full bg-[#0f1d2c]/70"
            />
          </div>

          <p className="m-0 mt-[2.2cqw] max-w-[62cqw] text-[1.6cqw] leading-relaxed text-[#243447]">
            est dûment enregistré(e) en qualité de membre de la CanCham
            Madagascar
            {fin ? " pour la période allant du :" : " depuis le :"}
          </p>
          <p className="m-0 mt-[0.8cqw] text-[1.9cqw] font-bold">
            {fin ? `${fmtDate(du)} au ${fmtDate(fin)}` : fmtDate(du)}
          </p>

          <p className="m-0 mt-[1.6cqw] max-w-[62cqw] text-[1.6cqw] leading-relaxed text-[#243447]">
            Le présent certificat est délivré à l’intéressé(e) pour servir et
            valoir ce que de droit.
          </p>

          {/* Le sceau à gauche, la signature à droite, comme sur le modèle. */}
          <div className="mt-auto flex w-full items-end justify-between gap-[3cqw]">
            <Image
              src="/marque/badge-certificat.png"
              alt=""
              aria-hidden
              width={254}
              height={339}
              sizes="140px"
              className="h-auto w-[9cqw] shrink-0"
            />
            <div className="text-right text-[1.5cqw] leading-snug">
              Ando Lalaina Ratovomanana
              <br />
              <b className="font-bold">
                Présidente du Conseil d’Administration
              </b>
            </div>
          </div>

          <div className="mt-[1.4cqw] text-[1.4cqw] text-[#4a5a6b]">
            {COORDONNEES.site}
          </div>
        </div>
      </div>
    </div>
  );
}
