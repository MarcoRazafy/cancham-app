import type { CSSProperties, ReactNode } from "react";

/**
 * Squelettes de chargement.
 *
 * Pendant qu'une page se prépare, on montre sa forme — titre, cartes,
 * lignes — parcourue d'un reflet, plutôt qu'un écran vide ou une roue qui
 * tourne au milieu de nulle part. La mise en page ne saute pas quand le
 * contenu arrive : il prend la place de sa silhouette.
 *
 * Les formes sont purement décoratives (`aria-hidden`) ; le conteneur
 * annonce une seule fois « Chargement… » aux lecteurs d'écran.
 */

/** Un bloc gris parcouru d'un reflet. */
export function Bloc({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <div aria-hidden className={`squelette ${className}`} style={style} />;
}

/** Conteneur d'un écran en chargement, avec la barre en haut de l'écran. */
export function Chargement({ children }: { children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      <div aria-hidden className="barre-chargement" />
      <div className="anim-fondu">{children}</div>
    </div>
  );
}

/** Titre de page et son chapeau. */
export function SqueletteEnTete() {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <Bloc className="h-3 w-40" />
      <Bloc className="h-9 w-[min(420px,80%)]" />
      <Bloc className="h-3.5 w-[min(560px,95%)]" />
    </div>
  );
}

/** Rangée de compteurs, comme en tête du tableau de bord. */
export function SqueletteCompteurs({ nombre = 4 }: { nombre?: number }) {
  return (
    <div className="grid gap-4 mb-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: nombre }, (_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-m)] border border-line bg-surface p-5 flex gap-4"
        >
          <Bloc className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 flex flex-col gap-2.5">
            <Bloc className="h-3 w-24" />
            <Bloc className="h-7 w-16" />
            <Bloc className="h-2.5 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Grille de cartes à image : annuaire, événements, offres. */
export function SqueletteCartes({
  nombre = 6,
  hauteurImage = 150,
}: {
  nombre?: number;
  hauteurImage?: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: nombre }, (_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-m)] border border-line bg-surface overflow-hidden"
        >
          <Bloc
            className="w-full rounded-none"
            style={{ height: hauteurImage }}
          />
          <div className="p-4 flex flex-col gap-2.5">
            <Bloc className="h-4 w-3/4" />
            <Bloc className="h-3 w-1/2" />
            <Bloc className="h-3 w-full" />
            <Bloc className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Liste de lignes avec pastille : membres, messages, participants. */
export function SqueletteListe({ lignes = 6 }: { lignes?: number }) {
  return (
    <div className="rounded-[var(--radius-m)] border border-line bg-surface">
      {Array.from({ length: lignes }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-4 border-b border-line last:border-b-0"
        >
          <Bloc className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Bloc className="h-3.5 w-[40%]" />
            <Bloc className="h-3 w-[65%]" />
          </div>
          <Bloc className="h-8 w-24 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Panneau à titre, avec quelques lignes : les encadrés du back-office. */
export function SquelettePanneau({ lignes = 4 }: { lignes?: number }) {
  return (
    <div className="rounded-[var(--radius-m)] border border-line bg-surface p-6 flex flex-col gap-3">
      <Bloc className="h-5 w-48" />
      <Bloc className="h-3 w-64 mb-2" />
      {Array.from({ length: lignes }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-1.5">
          <Bloc className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Bloc className="h-3 w-[55%]" />
            <Bloc className="h-2.5 w-[35%]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Messagerie : la liste des conversations et une conversation ouverte. */
export function SqueletteMessagerie() {
  return (
    <div className="flex border border-line rounded-[var(--radius-m)] bg-surface overflow-hidden md:h-[min(680px,calc(100vh-220px))] md:min-h-[480px]">
      <div className="w-full md:w-[320px] md:border-r border-line p-3 flex flex-col gap-1">
        <Bloc className="h-10 w-full mb-2" />
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2.5">
            <Bloc className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Bloc className="h-3 w-[60%]" />
              <Bloc className="h-2.5 w-[85%]" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:flex flex-1 flex-col p-5 gap-3">
        <Bloc className="h-10 w-64 mb-3" />
        <Bloc className="h-12 w-[45%] rounded-2xl" />
        <Bloc className="h-16 w-[55%] rounded-2xl self-end" />
        <Bloc className="h-10 w-[38%] rounded-2xl" />
        <Bloc className="h-12 w-[42%] rounded-2xl self-end" />
        <Bloc className="h-11 w-full mt-auto rounded-full" />
      </div>
    </div>
  );
}
