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

/**
 * En-tête de l'espace public, sur toutes les pages.
 *
 * Sur la page d'accueil, il se pose sur la bannière, sans filet ; ailleurs,
 * un filet le sépare du contenu. Sur téléphone, il tient sur une ligne : le
 * logo rétrécit et seul le bouton « Espace membre » reste, les autres liens
 * étant dans la page et dans le pied.
 */
export function EnTetePublique({
  surBanniere = false,
}: {
  surBanniere?: boolean;
}) {
  const lien =
    "hidden text-[13px] font-semibold px-3.5 py-2.5 rounded-[5px] text-white/80 hover:text-white no-underline whitespace-nowrap";
  return (
    <header className={surBanniere ? "" : "border-b border-white/10"}>
      <div className="max-w-[1120px] mx-auto px-5 py-4 md:py-5 flex items-center justify-between gap-4">
        <Link
          href="/public"
          aria-label="Accueil CanCham Connect"
          className="shrink-0"
        >
          <LogoOfficiel
            className="w-[168px] sm:w-[220px] md:w-[260px] h-auto"
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
            className="btn-contour btn-contour-sm text-white hover:bg-white/10 ml-1"
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
  const lien = "text-white/60 hover:text-white no-underline";
  return (
    <footer className="border-t border-white/10 mt-auto">
      <div className="max-w-[1120px] mx-auto px-5 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <Link href="/public" aria-label="Accueil CanCham Connect">
            <LogoOfficiel className="w-[180px] h-auto" />
          </Link>
          <span className="text-[12.5px] text-white/50">
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
