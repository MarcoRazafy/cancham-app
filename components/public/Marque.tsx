import Image from "next/image";
import Link from "next/link";

/**
 * Éléments de marque, conformes à la charte CanCham.
 *
 * Règle de la charte : la version couleur sur fond pâle, la version renversée
 * sur fond foncé. L'espace public étant sombre, c'est la renversée qui sert
 * partout ici. Le sigle seul ne remplace jamais le logo — il est réservé aux
 * usages listés par la charte (avatar social, objet promotionnel, élément
 * graphique), d'où son emploi ici en simple ornement de fond.
 */

export function LogoOfficiel({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/marque/logo-blanc.png"
      alt="CanCham — Chambre de Commerce et de Coopération Canada-Madagascar"
      width={2383}
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

/** Bandeau de tête des pages publiques secondaires. */
export function EnTetePublique() {
  return (
    <header className="border-b border-white/10">
      <div className="max-w-[1120px] mx-auto px-5 py-5 flex items-center justify-between gap-6 flex-wrap">
        <Link href="/public" aria-label="Accueil CanCham Connect">
          <LogoOfficiel className="w-[260px] h-auto" priority />
        </Link>
        <nav className="flex items-center gap-2.5 text-[13px]">
          <Link
            href="/public#evenements"
            className="font-[family-name:var(--font-titre)] font-semibold px-4 py-2.5 rounded-lg text-white/85 hover:text-white no-underline"
          >
            Événements
          </Link>
          <Link
            href="/membre"
            className="font-[family-name:var(--font-titre)] font-semibold px-4 py-2.5 rounded-lg border border-white/25 text-white hover:bg-white/10 no-underline"
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
  return (
    <footer className="border-t border-white/10 mt-auto">
      <div className="max-w-[1120px] mx-auto px-5 py-6 flex items-center justify-between gap-4 flex-wrap text-[12.5px] text-white/55">
        <span>CanCham Connect · Canada–Madagascar</span>
        <span className="flex gap-5">
          <Link href="/public/adhesion" className="text-white/55 hover:text-white no-underline">
            Devenir membre
          </Link>
          <Link href="/membre" className="text-white/55 hover:text-white no-underline">
            Espace membre
          </Link>
          <Link href="/admin" className="text-white/55 hover:text-white no-underline">
            Back-office
          </Link>
        </span>
      </div>
    </footer>
  );
}
