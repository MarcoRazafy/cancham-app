import Image from "next/image";
import Link from "next/link";

/**
 * Éléments de marque, conformes à la charte CanCham.
 *
 * Règle de la charte : la version couleur sur fond pâle, la version renversée
 * sur fond foncé. L'espace public est blanc : c'est la version couleur qui
 * sert, la renversée restant disponible pour un fond sombre. Le sigle seul ne
 * remplace jamais le logo — il est réservé aux usages listés par la charte
 * (avatar social, objet promotionnel, élément graphique), d'où son emploi ici
 * en simple ornement de fond.
 */

const LOGOS = {
  couleur: { src: "/marque/logo-couleur.png", width: 2536 },
  blanc: { src: "/marque/logo-blanc.png", width: 2383 },
} as const;

export function LogoOfficiel({
  className = "",
  priority = false,
  version = "couleur",
}: {
  className?: string;
  priority?: boolean;
  version?: keyof typeof LOGOS;
}) {
  return (
    <Image
      src={LOGOS[version].src}
      alt="CanCham — Chambre de Commerce et de Coopération Canada-Madagascar"
      width={LOGOS[version].width}
      height={711}
      priority={priority}
      className={className}
      sizes="(max-width: 768px) 260px, 340px"
    />
  );
}

export function Sigle({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/marque/sigle.png"
      alt=""
      aria-hidden="true"
      width={1888}
      height={1159}
      className={className}
      style={{ width: size, height: "auto" }}
    />
  );
}

/**
 * En-tête de l'espace public, commun à toutes les pages.
 *
 * Blanc, et collé en haut au défilement : le chemin vers l'espace membre reste
 * à portée. Sur téléphone, il tient sur une ligne : le logo rétrécit et seul le
 * bouton « Espace membre » reste, les autres liens étant dans la page et dans
 * le pied.
 */
export function EnTetePublique() {
  const lien =
    "hidden text-[13px] font-semibold px-3.5 py-2.5 rounded-[5px] text-muted hover:text-ink hover:bg-surface-2 no-underline whitespace-nowrap";
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-line">
      <div className="max-w-[1120px] mx-auto px-5 py-3 md:py-4 flex items-center justify-between gap-4">
        <Link
          href="/public"
          aria-label="Accueil CanCham Connect"
          className="shrink-0"
        >
          <LogoOfficiel
            className="w-[168px] sm:w-[210px] md:w-[240px] h-auto"
            priority
          />
        </Link>
        <nav
          aria-label="Navigation principale"
          className="flex items-center gap-1 md:gap-2"
        >
          <Link href="/public#evenements" className={`${lien} sm:inline-flex`}>
            Événements
          </Link>
          <Link href="/public/adhesion" className={`${lien} md:inline-flex`}>
            Devenir membre
          </Link>
          <Link
            href="/membre"
            className="btn-contour btn-contour-sm text-marque-nuit hover:bg-surface-2 ml-1"
          >
            Espace membre
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Pied de page commun à l'espace public. */
export function PiedPublique() {
  const lien = "text-muted hover:text-ink no-underline";
  return (
    <footer className="border-t border-line bg-surface-2 mt-auto">
      <div className="max-w-[1120px] mx-auto px-5 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <Link href="/public" aria-label="Accueil CanCham Connect">
            <LogoOfficiel className="w-[180px] h-auto" />
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
          <Link href="/public/adhesion" className={lien}>
            Devenir membre
          </Link>
          <Link href="/membre" className={lien}>
            Espace membre
          </Link>
          <Link href="/admin" className={lien}>
            Back-office
          </Link>
        </nav>
      </div>
    </footer>
  );
}
