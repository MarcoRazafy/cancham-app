import { Fragment, type ReactNode } from "react";
import {
  lienVideo,
  type Alignement,
  type Bloc,
  type Ligne,
  type Passage,
} from "@/lib/blocs";
import { PhotoPleinEcran } from "./PhotoPleinEcran";
import { VideoPrivee } from "./VideoPrivee";

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
      <PhotoPleinEcran src={source(bloc.fichier)} legende={bloc.legende} />
    );
  }

  if (bloc.source === "lien") {
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
  titre: string;
  blocs: Bloc[];
}) {
  return (
    <article className="flex w-full flex-col gap-6 rounded-[var(--radius-m)] border border-line bg-surface px-5 py-7 sm:px-10 sm:py-9">
      {blocs.map((bloc, i) => (
        <BlocLu key={i} id={id} bloc={bloc} titre={titre} />
      ))}
    </article>
  );
}
