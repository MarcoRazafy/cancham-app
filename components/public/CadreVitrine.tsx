import Link from "next/link";
import { connection } from "next/server";
import { LogoOfficiel } from "@/components/public/Marque";
import { fmtDate } from "@/lib/format";
import { getProchainsEvenements } from "@/lib/queries";

/**
 * En-tête et pied de la vitrine, sur le modèle du site cancham.mg.
 *
 * En haut, un bandeau rouge fait défiler les prochains rendez-vous ; dessous,
 * la barre blanche : le logo de la chambre, les liens, et le bouton rouge
 * « Se connecter ». Les deux restent collés en haut au défilement.
 *
 * La barre garde ses propres couleurs, écrites en clair : posée sur la
 * vitrine sombre, les jetons de teinte de l'application y rendraient le
 * texte blanc sur blanc.
 */

/** Les liens de la barre, dans l'ordre où on les lit. */
const LIENS = [
  { href: "/public", libelle: "Accueil" },
  { href: "/public#evenements", libelle: "Événements" },
  { href: "/public#actualites", libelle: "Actualités" },
  { href: "/auth/inscription", libelle: "Devenir membre" },
];

const lien =
  "inline-flex items-center px-2.5 md:px-3 lg:px-3.5 py-1.5 md:py-2 rounded-[6px] text-[13px] md:text-[13.5px] font-semibold text-[#3d4b5c] no-underline whitespace-nowrap transition-colors hover:text-[var(--marque-nuit)] hover:bg-[#f3f5f8]";

/** Ce que le bandeau annonce quand aucun événement n'est programmé. */
const ANNONCES_PAR_DEFAUT = [
  { texte: "Le réseau des entreprises du Canada et de Madagascar", href: null },
  { texte: "Adhésions ouvertes toute l’année", href: "/auth/inscription" },
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
      <div className="bg-white/95 backdrop-blur-sm border-b border-[#e3e8ee]">
        {/*
          Sur téléphone, les liens passent d'eux-mêmes sous le logo : cinq
          entrées et un logo ne tiennent pas sur 390 pixels, et les cacher
          rendrait le site impraticable là où on le consulte le plus.
        */}
        <div className="max-w-[1240px] mx-auto px-4 sm:px-5 flex flex-wrap items-center justify-between gap-x-4 py-2.5 md:py-0 md:h-[72px]">
          <Link
            href="/public"
            aria-label="Accueil CanCham Connect"
            className="order-1 shrink-0"
          >
            <LogoOfficiel
              className="w-[150px] sm:w-[200px] md:w-[230px] h-auto"
              priority
            />
          </Link>

          <Link
            href="/auth"
            className="order-2 md:order-3 inline-flex items-center rounded-[6px] bg-marque-rouge px-4 sm:px-5 py-2.5 text-[12px] sm:text-[12.5px] font-bold uppercase tracking-[0.05em] text-white no-underline whitespace-nowrap transition-colors hover:bg-[#8f0606]"
          >
            Se connecter
          </Link>

          <nav
            aria-label="Navigation principale"
            className="order-3 md:order-2 w-full md:w-auto flex items-center gap-1 md:gap-2 mt-1.5 md:mt-0 -mx-1 px-1 md:mx-0 md:px-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {LIENS.map((l) => (
              <Link key={l.href} href={l.href} className={lien}>
                {l.libelle}
              </Link>
            ))}
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
          <Link href="/auth/inscription" className={lien}>
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
