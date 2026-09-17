import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui";

/**
 * Briques de mise en page du back-office.
 *
 * Elles reprennent le vocabulaire de l'espace membre — surtitre, titre à mot
 * saillant, tuile d'icône, filet de couleur — pour que toutes les pages de
 * gestion se ressemblent sans que chacune ne recopie ses classes.
 */

export const TEINTES = {
  rouge: { tuile: "tuile-rouge", filet: "filet-rouge" },
  vert: { tuile: "tuile-verte", filet: "filet-vert" },
  bleu: { tuile: "tuile-bleue", filet: "filet-bleu" },
  degrade: { tuile: "tuile-rouge", filet: "filet-degrade" },
} as const;

export type Teinte = keyof typeof TEINTES;

/** En-tête d'une page de gestion : surtitre, titre, phrase, actions. */
export function EnTeteAdmin({
  surtitre,
  titre,
  children,
  actions,
}: {
  surtitre?: ReactNode;
  titre: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-x-6 gap-y-4 flex-wrap mb-6">
      <div className="min-w-0">
        {surtitre ? (
          <span className="surtitre text-faint">{surtitre}</span>
        ) : null}
        <h1 className="text-[clamp(26px,3vw,34px)] m-0 mt-1.5">{titre}</h1>
        {children ? (
          <p className="text-[14.5px] text-muted m-0 mt-1.5 max-w-[68ch]">
            {children}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>
      ) : null}
    </div>
  );
}

/**
 * Compteur à tuile d'icône.
 *
 * Avec un lien, la carte entière mène à la liste qu'il résume, et le filet se
 * déroule au survol ; sans lien, le filet est posé d'emblée.
 */
export function Compteur({
  icone,
  libelle,
  valeur,
  detail,
  href,
  teinte = "rouge",
}: {
  icone: ReactNode;
  libelle: string;
  valeur: ReactNode;
  detail?: ReactNode;
  href?: string;
  teinte?: Teinte;
}) {
  const corps = (
    <Card
      className={`tuile-hote carte-filet ${href ? "" : "filet-fixe"} ${TEINTES[teinte].filet} p-5 h-full flex gap-4 items-start`}
    >
      <span className={`tuile tuile-sm ${TEINTES[teinte].tuile}`}>{icone}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] text-muted">{libelle}</span>
        <span className="titre block text-[28px] leading-tight text-ink tabular-nums mt-0.5">
          {valeur}
        </span>
        {detail ? (
          <span className="block text-[12.5px] text-muted mt-1">{detail}</span>
        ) : null}
      </span>
    </Card>
  );
  return href ? (
    <Link href={href} className="no-underline block h-full">
      {corps}
    </Link>
  ) : (
    corps
  );
}

/** Carte à titre, avec lien « voir tout » facultatif. */
export function Panneau({
  titre,
  sousTitre,
  lien,
  teinte = "degrade",
  className = "",
  corpsClassName = "px-6 pb-6",
  children,
}: {
  titre: ReactNode;
  sousTitre?: ReactNode;
  lien?: { href: string; libelle: string };
  teinte?: Teinte;
  className?: string;
  corpsClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card
      className={`carte-filet filet-fixe ${TEINTES[teinte].filet} p-0 ${className}`}
    >
      <div className="flex items-end justify-between gap-4 flex-wrap px-6 pt-5 pb-4">
        <div className="min-w-0">
          <h2 className="text-[18px] m-0">{titre}</h2>
          {sousTitre ? (
            <p className="text-[13px] text-muted m-0 mt-1">{sousTitre}</p>
          ) : null}
        </div>
        {lien ? <LienFleche href={lien.href}>{lien.libelle}</LienFleche> : null}
      </div>
      <div className={corpsClassName}>{children}</div>
    </Card>
  );
}

export function LienFleche({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent no-underline hover:underline whitespace-nowrap"
    >
      {children} <ArrowRight size={14} />
    </Link>
  );
}

/** Onglets de filtre, portés par l'URL : partageables et sans JavaScript. */
export function Onglets({
  onglets,
  actif,
}: {
  onglets: { cle: string; libelle: string; href: string; compte?: number }[];
  actif: string;
}) {
  return (
    <div className="flex gap-1 border-b border-line mb-5 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {onglets.map((o) => {
        const courant = o.cle === actif;
        return (
          <Link
            key={o.cle}
            href={o.href}
            aria-current={courant ? "page" : undefined}
            className={`shrink-0 inline-flex items-center gap-2 px-1 py-2.5 mr-5 text-[13.5px] font-semibold no-underline border-b-2 ${
              courant
                ? "text-accent border-accent"
                : "text-muted border-transparent hover:text-ink"
            }`}
          >
            {o.libelle}
            {o.compte !== undefined ? (
              <span
                className={`text-[11px] font-bold px-[7px] py-px rounded-full ${
                  courant
                    ? "bg-accent-soft text-accent-strong"
                    : "bg-surface-3 text-muted"
                }`}
              >
                {o.compte}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

/** Barre de remplissage : inscrits sur capacité, part d'un total. */
export function Jauge({
  valeur,
  max,
  teinte = "rouge",
}: {
  valeur: number;
  max: number;
  teinte?: "rouge" | "vert" | "bleu";
}) {
  const part = max > 0 ? Math.min(100, Math.round((valeur / max) * 100)) : 0;
  const couleur = {
    rouge: "bg-accent",
    vert: "bg-success",
    bleu: "bg-[#14263a]",
  }[teinte];
  return (
    <span
      className="block h-1.5 rounded-full bg-surface-3 overflow-hidden"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={valeur}
    >
      <span
        className={`block h-full rounded-full ${couleur}`}
        style={{ width: `${part}%` }}
      />
    </span>
  );
}

/** Message d'une liste vide, dans une carte ou un panneau. */
export function Vide({
  icone,
  children,
}: {
  icone?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 py-8 px-4 text-[13.5px] text-muted">
      {icone ? <span className="text-faint">{icone}</span> : null}
      {children}
    </div>
  );
}
