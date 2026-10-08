import { Fragment, type ReactNode } from "react";
import {
  lienVideo,
  type Alignement,
  type Bloc,
  type Ligne,
  type Passage,
} from "@/lib/blocs";
import { VideoPrivee } from "./VideoPrivee";

/**
 * Une page de ressource composée dans la plateforme, telle qu'on la lit.
 *
 * Le texte mis en forme est redessiné à partir de sa description — tel
 * passage en gras, tel autre en lien : aucun HTML saisi n'est injecté. Les
 * photos et les vidéos déposées se chargent par une route qui revérifie
 * l'accès ; une vidéo donnée par un lien se lit dans la page, sans sortie
 * vers son hébergeur (`VideoPrivee`).
 *
 * Sans état ni effet : le même composant dessine la page côté serveur, pour
 * la lecture, et dans l'éditeur, pour l'aperçu d'une vidéo.
 */

const ALIGNEMENT: Record<Alignement, string> = {
  centre: "text-center",
  droite: "text-right",
};

function Passages({ passages }: { passages: Passage[] }) {
  return passages.map((p, i) => {
    let contenu: ReactNode = p.t
      .split("\n")
      .flatMap((morceau, j) =>
        j ? [<br key={`r${j}`} />, morceau] : [morceau],
      );
    if (p.s) contenu = <u>{contenu}</u>;
    if (p.i) contenu = <i>{contenu}</i>;
    if (p.g) contenu = <b>{contenu}</b>;
    if (p.couleur || p.taille) {
      contenu = (
        <span
          data-taille={p.taille}
          style={p.couleur ? { color: p.couleur } : undefined}
        >
          {contenu}
        </span>
      );
    }
    if (p.lien) {
      // Un chemin de la plateforme s'ouvre sur place ; le reste, à côté.
      const interne = p.lien.startsWith("/");
      contenu = (
        <a
          href={p.lien}
          {...(interne ? {} : { target: "_blank", rel: "noopener noreferrer" })}
        >
          {contenu}
        </a>
      );
    }
    return <Fragment key={i}>{contenu}</Fragment>;
  });
}

export function TexteMisEnForme({ lignes }: { lignes: Ligne[] }) {
  return (
    <div className="texte-riche">
      {lignes.map((l, i) =>
        l.genre === "p" ? (
          <p
            key={i}
            className={l.alignement ? ALIGNEMENT[l.alignement] : undefined}
          >
            {/* Un paragraphe vide est une ligne blanche : il garde sa hauteur. */}
            {l.passages.length ? <Passages passages={l.passages} /> : <br />}
          </p>
        ) : l.genre === "ul" ? (
          <ul key={i}>
            {l.items.map((item, j) => (
              <li key={j}>
                <Passages passages={item} />
              </li>
            ))}
          </ul>
        ) : (
          <ol key={i}>
            {l.items.map((item, j) => (
              <li key={j}>
                <Passages passages={item} />
              </li>
            ))}
          </ol>
        ),
      )}
    </div>
  );
}

/**
 * Une vidéo donnée par son lien, dans le cadre de son hébergeur, tel quel.
 *
 * Pour l'aperçu de l'éditeur seulement : l'équipe y vérifie qu'elle a collé
 * la bonne vidéo, titre compris. Les membres, eux, la lisent par
 * `VideoPrivee`, qui ne laisse aucune sortie vers l'hébergeur.
 */
export function VideoEnLien({ url, titre }: { url: string; titre: string }) {
  const video = lienVideo(url);
  if (!video) return null;
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-m)] bg-black">
      <iframe
        src={video.integration}
        title={titre}
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}

function BlocLu({
  id,
  bloc,
  titre,
}: {
  id: string;
  bloc: Bloc;
  titre: string;
}) {
  if (bloc.type === "titre") {
    const classe = `m-0 [overflow-wrap:anywhere] ${bloc.alignement ? ALIGNEMENT[bloc.alignement] : ""}`;
    const style = bloc.couleur ? { color: bloc.couleur } : undefined;
    return bloc.niveau === 2 ? (
      <h2 className={`${classe} text-[26px] leading-tight`} style={style}>
        {bloc.texte}
      </h2>
    ) : (
      <h3 className={`${classe} text-[20px] leading-snug`} style={style}>
        {bloc.texte}
      </h3>
    );
  }
  if (bloc.type === "texte") return <TexteMisEnForme lignes={bloc.lignes} />;

  const source = (fichier: string) => `/api/ressources/${id}/blocs/${fichier}`;
  if (bloc.type === "photo") {
    return (
      <figure className="m-0">
        {/*
          Une <img> ordinaire, pas next/image : son optimiseur mettrait la
          photo en cache sous une adresse publique, hors du contrôle d'accès.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={source(bloc.fichier)}
          alt={bloc.legende ?? ""}
          loading="lazy"
          className="block h-auto w-full rounded-[var(--radius-m)]"
        />
        {bloc.legende ? (
          <figcaption className="mt-2 text-center text-[13px] text-muted">
            {bloc.legende}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (bloc.source === "lien") {
    // À la lecture, l'adresse de la vidéo ne doit pas servir de sortie.
    return <VideoPrivee url={bloc.url} titre={titre} />;
  }
  return (
    <div className="overflow-hidden rounded-[var(--radius-m)] bg-black">
      <video
        src={source(bloc.fichier)}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        preload="metadata"
        aria-label={titre}
        className="block h-auto w-full"
      />
    </div>
  );
}

export function PageRessource({
  id,
  titre,
  blocs,
}: {
  id: string;
  /** Le titre de la ressource : il nomme ses vidéos pour les lecteurs d'écran. */
  titre: string;
  blocs: Bloc[];
}) {
  return (
    <article className="mx-auto flex w-full max-w-[860px] flex-col gap-6 rounded-[var(--radius-m)] border border-line bg-surface px-5 py-7 sm:px-10 sm:py-9">
      {blocs.map((bloc, i) => (
        <BlocLu key={i} id={id} bloc={bloc} titre={titre} />
      ))}
    </article>
  );
}
