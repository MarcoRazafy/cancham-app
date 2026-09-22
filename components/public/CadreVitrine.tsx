import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpRight, CircleUserRound } from "lucide-react";
import { LogoOfficiel, Sigle } from "@/components/public/Marque";
import { fmtDate } from "@/lib/format";
import { getProchainsEvenements } from "@/lib/queries";

/**
 * En-tête et pied de la vitrine, sur le modèle du site cancham.mg.
 *
 * En haut, un bandeau rouge fait défiler les prochains rendez-vous ; dessous,
 * la barre bleu nuit : le sigle et le nom, les liens, et le bloc rouge
 * « Devenir membre » sur toute la hauteur. Les deux restent collés en haut
 * au défilement.
 */

/** Ce que le bandeau annonce quand aucun événement n'est programmé. */
const ANNONCES_PAR_DEFAUT = [
  { texte: "Le réseau des entreprises du Canada et de Madagascar", href: null },
  { texte: "Adhésions ouvertes toute l’année", href: "/public#adhesion" },
  { texte: "Événements, ressources et mises en relation", href: null },
];

/**
 * Assez d'annonces pour couvrir un grand écran : la piste défile de la
 * moitié de sa longueur, puis reprend au début sans à-coup.
 */
const ANNONCES_MIN = 8;

export async function EnTetePublique() {
  // Lu à chaque visite, jamais à la compilation : la base n'est pas joignable
  // pendant le build, et le bandeau doit suivre la programmation.
  await connection();
  const evenements = await getProchainsEvenements(6);
  const annonces = evenements.length
    ? evenements.map((e) => ({
        texte: [
          e.titre,
          fmtDate(e.date, { day: "numeric", month: "long", year: "numeric" }),
          e.lieu,
        ]
          .filter(Boolean)
          .join(" — "),
        href: `/public/evenements/${e.id}`,
      }))
    : ANNONCES_PAR_DEFAUT;

  let piste = annonces;
  while (piste.length < ANNONCES_MIN) piste = piste.concat(annonces);

  const lien =
    "hidden lg:flex items-center px-4 text-[14.5px] text-white/85 no-underline transition-colors hover:text-white";

  return (
    <header className="sticky top-0 z-40">
      {/* ---------- Bandeau des annonces ---------- */}
      <div
        className="bandeau-annonces overflow-hidden bg-marque-rouge text-white"
        aria-label="Prochains rendez-vous"
      >
        <div
          className="bandeau-piste flex w-max"
          style={{ animationDuration: `${piste.length * 7}s` }}
        >
          {[0, 1].map((copie) => (
            <ul
              key={copie}
              aria-hidden={copie === 1 ? true : undefined}
              className="flex shrink-0 list-none m-0 p-0"
            >
              {piste.map((a, i) => (
                <li
                  key={i}
                  className="flex items-center whitespace-nowrap text-[13px] font-semibold"
                >
                  {a.href ? (
                    <Link
                      href={a.href}
                      tabIndex={copie === 1 ? -1 : undefined}
                      className="px-6 py-2.5 text-white no-underline hover:underline underline-offset-2"
                    >
                      {a.texte}
                    </Link>
                  ) : (
                    <span className="px-6 py-2.5">{a.texte}</span>
                  )}
                  <span aria-hidden="true" className="text-white/80">
                    •
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* ---------- Barre de navigation ---------- */}
      <div className="bg-[var(--marque-nuit)] border-b border-white/10">
        <div className="max-w-[1240px] mx-auto pl-4 sm:pl-5 flex items-stretch justify-between h-[58px] md:h-[64px]">
          <Link
            href="/public"
            aria-label="Accueil CanCham Connect"
            className="flex items-center gap-2.5 no-underline shrink-0"
          >
            <Sigle size={38} className="shrink-0" />
            <span className="leading-none">
              <span className="titre block text-[18px] md:text-[20px] font-bold text-white">
                CanCham
              </span>
              <span className="block mt-1 text-[9.5px] md:text-[10.5px] font-semibold tracking-[0.16em] text-white/60">
                CANADA · MADAGASCAR
              </span>
            </span>
          </Link>

          <nav
            aria-label="Navigation principale"
            className="flex items-stretch min-w-0"
          >
            <Link href="/public#evenements" className={lien}>
              Événements
            </Link>
            <Link href="/public#adhesion" className={lien}>
              Adhésion
            </Link>
            <a
              href="https://cancham.mg"
              target="_blank"
              rel="noopener noreferrer"
              className={`${lien} gap-1`}
            >
              Site CanCham <ArrowUpRight size={14} />
            </a>
            {/* Sur téléphone, l'icône seule : la barre tient sur une ligne. */}
            <Link
              href="/auth"
              aria-label="Espace membre"
              className="flex items-center gap-2 px-3 sm:px-4 text-[14.5px] font-semibold text-white/85 no-underline transition-colors hover:text-white whitespace-nowrap"
            >
              <CircleUserRound size={22} className="sm:hidden" />
              <span className="hidden sm:inline">Espace membre</span>
            </Link>
            <Link
              href="/public#adhesion"
              className="flex items-center px-4 sm:px-7 bg-marque-rouge text-white text-[12.5px] sm:text-[14px] font-bold uppercase tracking-[0.04em] no-underline whitespace-nowrap transition-colors hover:bg-[#8f0606] shadow-[0_10px_24px_-12px_rgb(173_7_7/0.9)]"
            >
              <span className="sm:hidden">Adhérer</span>
              <span className="hidden sm:inline">Devenir membre</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

/** Pied de la vitrine, sur le même fond sombre. */
export function PiedPublique() {
  const lien = "text-muted hover:text-ink no-underline";
  return (
    <footer className="border-t border-line bg-surface mt-auto">
      <div className="max-w-[1120px] mx-auto px-5 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <Link href="/public" aria-label="Accueil CanCham Connect">
            <LogoOfficiel version="blanc" className="w-[180px] h-auto" />
          </Link>
          <span className="text-[12.5px] text-faint">
            © {new Date().getFullYear()} CanCham · Le réseau Canada–Madagascar
          </span>
        </div>
        <nav
          aria-label="Liens du pied de page"
          className="flex flex-wrap gap-x-6 gap-y-3 text-[13px]"
        >
          <Link href="/public#evenements" className={lien}>
            Événements
          </Link>
          <Link href="/public#adhesion" className={lien}>
            Devenir membre
          </Link>
          <Link href="/auth" className={lien}>
            Espace membre
          </Link>
          <a
            href="https://cancham.mg"
            target="_blank"
            rel="noopener noreferrer"
            className={lien}
          >
            cancham.mg
          </a>
        </nav>
      </div>
    </footer>
  );
}
