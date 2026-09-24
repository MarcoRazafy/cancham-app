import Image from "next/image";
import { LogoOfficiel } from "@/components/public/Marque";
import { COORDONNEES } from "@/lib/coordonnees";
import { fmtDate } from "@/lib/format";
import type { Member } from "@/lib/types";

/**
 * Certificat d'adhésion, tel qu'il s'imprime.
 *
 * Il reprend le modèle de la chambre : le logo en tête, le nom de l'entreprise
 * au centre sur son filet, la période couverte, la signature de la présidence,
 * et le sceau en bas à gauche. Pas de génération de PDF — la page est conçue
 * pour l'impression, et le navigateur fait l'export.
 *
 * Partagé par la fenêtre ouverte depuis « Mon entreprise » et par la page
 * d'impression : ce qu'on voit à l'écran est exactement ce qui sort sur le
 * papier.
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
    <div className="certificat relative mx-auto w-full max-w-[860px] overflow-hidden rounded-[14px] border border-line bg-white text-[#0f1d2c] print:max-w-none print:rounded-none print:border-0">
      {/* Les deux couleurs de la charte, en équerre, comme sur le modèle. */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-[7px] w-[42%] bg-[#ad0707]"
      />
      <span
        aria-hidden
        className="absolute right-0 top-0 h-[7px] w-[16%] bg-[#007140]"
      />
      <span
        aria-hidden
        className="absolute bottom-0 right-0 h-[7px] w-[42%] bg-[#007140]"
      />
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-[7px] w-[16%] bg-[#ad0707]"
      />

      {/* Le sigle en filigrane : présent, jamais gênant. */}
      <Image
        src="/marque/sigle.png"
        alt=""
        aria-hidden
        width={1888}
        height={1159}
        sizes="700px"
        className="pointer-events-none absolute left-1/2 top-1/2 w-[78%] -translate-x-1/2 -translate-y-1/2 opacity-[0.045]"
      />

      <div className="relative px-8 py-9 text-center sm:px-14">
        <LogoOfficiel className="mx-auto h-auto w-[180px]" />

        <h1 className="m-0 mt-6 text-[clamp(26px,4.4vw,38px)] leading-tight font-bold">
          Certificat d’adhésion
        </h1>

        <p className="mx-auto mt-5 max-w-[56ch] text-[14.5px] leading-relaxed text-[#243447]">
          La Chambre de Commerce et de Coopération Canada Madagascar (CanCham
          Madagascar) certifie par la présente que :
        </p>

        <div className="mx-auto mt-5 max-w-[46ch]">
          <div className="text-[clamp(22px,3.4vw,30px)] font-bold leading-tight break-words">
            {m.nom}
          </div>
          <div aria-hidden className="mt-3 h-px w-full bg-[#0f1d2c]/70" />
        </div>

        <p className="mx-auto mt-5 max-w-[58ch] text-[14.5px] leading-relaxed text-[#243447]">
          est dûment enregistré(e) en qualité de membre de la CanCham Madagascar
          {fin ? " pour la période allant du :" : " depuis le :"}
        </p>
        <p className="m-0 mt-2 text-[16px] font-bold">
          {fin ? `${fmtDate(du)} au ${fmtDate(fin)}` : fmtDate(du)}
        </p>

        <p className="mx-auto mt-5 max-w-[58ch] text-[14.5px] leading-relaxed text-[#243447]">
          Le présent certificat est délivré à l’intéressé(e) pour servir et
          valoir ce que de droit.
        </p>

        {/* La signature à droite, le sceau à gauche, comme sur le modèle. */}
        <div className="mt-9 flex items-end justify-between gap-6">
          <Image
            src="/marque/badge-certificat.png"
            alt=""
            aria-hidden
            width={254}
            height={339}
            sizes="110px"
            className="h-auto w-[84px] shrink-0 sm:w-[104px]"
          />
          <div className="text-right text-[14px] leading-snug">
            Ando Lalaina Ratovomanana
            <br />
            <b className="font-bold">Présidente du Conseil d’Administration</b>
          </div>
        </div>

        <div className="mt-6 text-[12.5px] text-[#4a5a6b]">
          {COORDONNEES.site}
        </div>
      </div>
    </div>
  );
}
