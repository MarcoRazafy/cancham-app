"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  LoaderCircle,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { lienVideo } from "@/lib/blocs";

const BAC_A_SABLE = "allow-scripts allow-same-origin allow-presentation";

type Etat = "attente" | "lecture" | "pause" | "tampon" | "fin";

interface Nouvelles {
  etat?: Etat;
  temps?: number;
  duree?: number;
  muet?: boolean;
}

interface Pilote {
  origine: string;
  adresse: (integration: string, ici: string) => string;
  salut: object;
  lire: object;
  pause: object;
  aller: (secondes: number) => object;
  couper: (muet: boolean) => object;
  recevoir: (
    message: Record<string, unknown>,
    connu: boolean,
  ) => { nouvelles: Nouvelles; reponses?: object[] } | null;
}

const nombre = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

const ETAT_YOUTUBE: Record<number, Etat> = {
  [-1]: "attente",
  0: "fin",
  1: "lecture",
  2: "pause",
  3: "tampon",
  5: "attente",
};
const ordreYoutube = (func: string, args: unknown[] = []) => ({
  event: "command",
  func,
  args,
  id: "cancham",
  channel: "widget",
});

const YOUTUBE: Pilote = {
  origine: "https://www.youtube-nocookie.com",
  adresse: (integration, ici) =>
    `${integration}&enablejsapi=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&playsinline=1&origin=${encodeURIComponent(ici)}`,
  salut: { event: "listening", id: "cancham", channel: "widget" },
  lire: ordreYoutube("playVideo"),
  pause: ordreYoutube("pauseVideo"),
  aller: (secondes) => ordreYoutube("seekTo", [secondes, true]),
  couper: (muet) => ordreYoutube(muet ? "mute" : "unMute"),
  recevoir: (message) => {
    const info = message.info as Record<string, unknown> | undefined;
    if (!info || typeof info !== "object") return { nouvelles: {} };
    const etat = nombre(info.playerState);
    return {
      nouvelles: {
        etat: etat === undefined ? undefined : ETAT_YOUTUBE[etat],
        temps: nombre(info.currentTime),
        duree: nombre(info.duration) || undefined,
        muet: typeof info.muted === "boolean" ? info.muted : undefined,
      },
    };
  },
};

const ECOUTES_VIMEO = [
  "play",
  "pause",
  "ended",
  "timeupdate",
  "bufferstart",
  "bufferend",
  "volumechange",
];

const VIMEO: Pilote = {
  origine: "https://player.vimeo.com",
  adresse: (integration) =>
    `${integration}${integration.includes("?") ? "&" : "?"}title=0&byline=0&portrait=0&controls=0&playsinline=1&dnt=1`,
  salut: { method: "ping" },
  lire: { method: "play" },
  pause: { method: "pause" },
  aller: (secondes) => ({ method: "setCurrentTime", value: secondes }),
  couper: (muet) => ({ method: "setVolume", value: muet ? 0 : 1 }),
  recevoir: (message, connu) => {
    const donnees = (message.data ?? {}) as Record<string, unknown>;
    if (message.event === "ready" || message.method === "ping") {
      return {
        nouvelles: {},
        reponses: connu
          ? []
          : [
              ...ECOUTES_VIMEO.map((value) => ({
                method: "addEventListener",
                value,
              })),
              { method: "getDuration" },
            ],
      };
    }
    if (message.method === "getDuration") {
      return { nouvelles: { duree: nombre(message.value) || undefined } };
    }
    switch (message.event) {
      case "play":
      case "bufferend":
        return { nouvelles: { etat: "lecture" } };
      case "pause":
        return { nouvelles: { etat: "pause" } };
      case "ended":
      case "finish":
        return { nouvelles: { etat: "fin" } };
      case "bufferstart":
        return { nouvelles: { etat: "tampon" } };
      case "timeupdate":
      case "playProgress":
        return {
          nouvelles: {
            temps: nombre(donnees.seconds),
            duree: nombre(donnees.duration) || undefined,
          },
        };
      case "volumechange":
        return { nouvelles: { muet: nombre(donnees.volume) === 0 } };
      default:
        return null;
    }
  },
};

function duree(secondes: number): string {
  const s = Math.max(0, Math.floor(secondes));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const reste = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${reste}` : `${m}:${reste}`;
}

const sansAbonnement = () => () => {};

export function VideoPrivee({ url, titre }: { url: string; titre: string }) {
  const video = lienVideo(url);
  if (!video) return null;
  if (video.plateforme === "drive") {
    return <CadreDrive adresse={video.integration} titre={titre} />;
  }
  return (
    <LecteurPilote
      pilote={video.plateforme === "youtube" ? YOUTUBE : VIMEO}
      integration={video.integration}
      affiche={
        video.plateforme === "youtube"
          ? `https://i.ytimg.com/vi/${/\/embed\/([^?]+)/.exec(video.integration)?.[1]}/hqdefault.jpg`
          : null
      }
      titre={titre}
    />
  );
}

function CadreDrive({ adresse, titre }: { adresse: string; titre: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-m)] bg-black">
      <iframe
        src={adresse}
        title={titre}
        loading="lazy"
        sandbox={BAC_A_SABLE}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full border-0"
      />
      <span className="absolute inset-x-0 top-0 h-[60px]" aria-hidden />
    </div>
  );
}

function LecteurPilote({
  pilote,
  integration,
  affiche,
  titre,
}: {
  pilote: Pilote;
  integration: string;
  affiche: string | null;
  titre: string;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const cadre = useRef<HTMLIFrameElement>(null);
  const dernier = useRef<Etat>("attente");
  const garde = useRef<ReturnType<typeof setTimeout> | null>(null);
  const habiller = useRef<() => void>(() => {});

  const [etat, setEtat] = useState<Etat>("attente");
  const [temps, setTemps] = useState(0);
  const [total, setTotal] = useState(0);
  const [muet, setMuet] = useState(false);
  const [pret, setPret] = useState(false);
  const [libre, setLibre] = useState(false);
  const [plein, setPlein] = useState(false);
  const [habille, setHabille] = useState(false);

  const ici = useSyncExternalStore(
    sansAbonnement,
    () => window.location.origin,
    () => null,
  );
  const pleinPossible = useSyncExternalStore(
    sansAbonnement,
    () => document.fullscreenEnabled,
    () => false,
  );

  const dire = (message: object) =>
    cadre.current?.contentWindow?.postMessage(
      JSON.stringify(message),
      pilote.origine,
    );

  useEffect(() => {
    if (!ici) return;
    let connu = false;
    let bandes: ReturnType<typeof setTimeout> | null = null;
    habiller.current = () => {
      setHabille(true);
      if (bandes) clearTimeout(bandes);
      bandes = setTimeout(() => setHabille(false), 4500);
    };
    const recevoir = (e: MessageEvent) => {
      const fenetre = cadre.current?.contentWindow;
      if (e.origin !== pilote.origine || !fenetre || e.source !== fenetre) {
        return;
      }
      let message: unknown;
      try {
        message = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (!message || typeof message !== "object") return;
      const recu = pilote.recevoir(message as Record<string, unknown>, connu);
      if (!recu) return;
      connu = true;
      setPret(true);
      for (const reponse of recu.reponses ?? []) {
        fenetre.postMessage(JSON.stringify(reponse), pilote.origine);
      }
      const { nouvelles } = recu;
      if (nouvelles.temps !== undefined) setTemps(nouvelles.temps);
      if (nouvelles.duree !== undefined) setTotal(nouvelles.duree);
      if (nouvelles.muet !== undefined) setMuet(nouvelles.muet);
      if (nouvelles.etat) {
        const jouait =
          dernier.current === "lecture" || dernier.current === "tampon";
        if (nouvelles.etat === "lecture" && !jouait) habiller.current();
        dernier.current = nouvelles.etat;
        setEtat(nouvelles.etat);
        if (nouvelles.etat === "lecture") setLibre(false);
      }
    };
    window.addEventListener("message", recevoir);
    const salut = setInterval(() => {
      if (connu) clearInterval(salut);
      else {
        cadre.current?.contentWindow?.postMessage(
          JSON.stringify(pilote.salut),
          pilote.origine,
        );
      }
    }, 500);
    const abandon = setTimeout(() => {
      if (!connu) setLibre(true);
    }, 8000);
    return () => {
      window.removeEventListener("message", recevoir);
      clearInterval(salut);
      clearTimeout(abandon);
      if (bandes) clearTimeout(bandes);
    };
  }, [ici, pilote]);

  useEffect(() => {
    const suivre = () =>
      setPlein(document.fullscreenElement === conteneur.current);
    document.addEventListener("fullscreenchange", suivre);
    return () => document.removeEventListener("fullscreenchange", suivre);
  }, []);

  useEffect(
    () => () => {
      if (garde.current) clearTimeout(garde.current);
    },
    [],
  );

  const lancer = () => {
    habiller.current();
    dire(pilote.lire);
    if (garde.current) clearTimeout(garde.current);
    garde.current = setTimeout(() => {
      if (dernier.current !== "lecture" && dernier.current !== "tampon") {
        setLibre(true);
      }
    }, 2500);
  };
  const basculer = () => {
    if (etat === "lecture" || etat === "tampon") {
      habiller.current();
      dire(pilote.pause);
    } else if (etat === "fin") {
      dire(pilote.aller(0));
      lancer();
    } else lancer();
  };
  const basculerPlein = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void conteneur.current?.requestFullscreen?.();
  };

  const joue = etat === "lecture";
  const occupe = etat === "tampon" || (!pret && !libre);
  const BOUTON =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/15";

  return (
    <div
      ref={conteneur}
      className="group/video relative aspect-video w-full overflow-hidden rounded-[var(--radius-m)] bg-black [&:fullscreen]:aspect-auto [&:fullscreen]:h-screen [&:fullscreen]:w-screen [&:fullscreen]:rounded-none"
    >
      {ici ? (
        <iframe
          ref={cadre}
          src={pilote.adresse(integration, ici)}
          title={titre}
          tabIndex={-1}
          sandbox={BAC_A_SABLE}
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : null}

      {["top-0", "bottom-0"].map((bord) => (
        <span
          key={bord}
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 ${bord} h-[17%] min-h-[62px] bg-black transition-opacity duration-500 ${
            habille && !libre ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <button
        type="button"
        onClick={basculer}
        disabled={!pret}
        aria-label={joue ? "Mettre en pause" : "Lire la vidéo"}
        className={`absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center border-0 p-0 disabled:cursor-wait ${
          libre ? "pointer-events-none" : ""
        } ${
          joue || libre
            ? "bg-transparent"
            : etat === "attente" || etat === "fin"
              ? "bg-[#0f1d2c]"
              : "bg-black/30"
        }`}
      >
        {etat === "attente" && affiche && !libre ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={affiche}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute inset-0 bg-[#0f1d2c]/35" />
          </>
        ) : null}
        {libre || joue ? null : (
          <span className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-accent text-white shadow-[0_10px_30px_-8px_rgb(0_0_0/0.7)] transition-transform group-hover/video:scale-105">
            {occupe ? (
              <LoaderCircle size={30} className="animate-spin" />
            ) : etat === "fin" ? (
              <RotateCcw size={28} />
            ) : (
              <Play size={30} className="ml-1" fill="currentColor" />
            )}
          </span>
        )}
      </button>

      {libre && !joue ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 m-0 text-center text-[12.5px] font-semibold text-white [text-shadow:0_1px_6px_rgb(0_0_0/0.9)]">
          Touchez la vidéo pour lancer la lecture.
        </p>
      ) : null}

      {pret && etat !== "attente" ? (
        <div
          className={`absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/85 to-transparent px-2.5 pb-2 pt-7 transition-opacity focus-within:opacity-100 group-hover/video:opacity-100 ${
            joue ? "opacity-0" : "opacity-100"
          }`}
        >
          <button
            type="button"
            onClick={basculer}
            aria-label={joue ? "Mettre en pause" : "Lire"}
            className={BOUTON}
          >
            {joue ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
          </button>
          <span className="shrink-0 text-[12px] font-semibold tabular-nums text-white">
            {duree(temps)} / {duree(total)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(1, Math.floor(total))}
            step={1}
            value={Math.min(Math.floor(temps), Math.max(1, Math.floor(total)))}
            aria-label="Avancement de la vidéo"
            onChange={(e) => {
              const vers = Number(e.target.value);
              setTemps(vers);
              habiller.current();
              dire(pilote.aller(vers));
            }}
            className="mx-1 h-1.5 min-w-0 flex-1 cursor-pointer accent-[var(--accent)]"
          />
          <button
            type="button"
            onClick={() => {
              habiller.current();
              dire(pilote.couper(!muet));
              setMuet(!muet);
            }}
            aria-label={muet ? "Rétablir le son" : "Couper le son"}
            className={BOUTON}
          >
            {muet ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {pleinPossible ? (
            <button
              type="button"
              onClick={basculerPlein}
              aria-label={plein ? "Quitter le plein écran" : "Plein écran"}
              className={BOUTON}
            >
              {plein ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
