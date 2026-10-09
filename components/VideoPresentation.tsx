"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Play, Plus, RefreshCw, Trash2, Video } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  CancelButton,
  ModalBody,
  ModalFooter,
  SubmitButton,
} from "@/components/form-bits";
import { retirerVideoPresentation } from "@/lib/actions/members";
import {
  ACCEPT_VIDEO,
  formatVideo,
  MORCEAU_VIDEO,
  PLAFOND_VIDEO,
  poidsLisible,
  urlVideo,
} from "@/lib/video-presentation";

const BOUTON =
  "inline-flex cursor-pointer items-center gap-[7px] rounded-[var(--radius-s)] border border-line bg-transparent px-[11px] py-1.5 text-[12.4px] font-semibold text-ink hover:bg-surface-2";

export function PresentationAvecVideo({
  memberId,
  nom,
  fichier,
  gestion,
  children,
}: {
  memberId: string;
  nom: string;
  fichier?: string | null;
  gestion?: string;
  children: ReactNode;
}) {
  if (!fichier && !gestion) return <>{children}</>;
  return (
    <div className="flex flex-col xl:block">
      <div
        className={`order-2 xl:float-right xl:ml-8 ${
          fichier
            ? "mt-5 xl:mb-4 xl:mr-6 xl:mt-10 xl:w-[416px] 2xl:mr-[calc((100%-1112px)*0.3)] 2xl:w-[440px]"
            : "mt-4 xl:mb-3 xl:mt-0 xl:w-[280px]"
        }`}
      >
        <VideoPresentation
          memberId={memberId}
          nom={nom}
          fichier={fichier}
          gestion={gestion}
          className="max-w-[520px] xl:max-w-none"
        />
      </div>
      <div className="order-1 min-w-0">{children}</div>
    </div>
  );
}

interface Envoi {
  nom: string;
  taille: number;
  envoye: number;
}

interface Session {
  arret: AbortController | null;
  id: string | null;
}

export function VideoPresentation({
  memberId,
  nom,
  fichier,
  gestion,
  className = "max-w-[520px]",
}: {
  memberId: string;
  nom: string;
  fichier?: string | null;
  gestion?: string;
  className?: string;
}) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState<Envoi | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const choix = useRef<HTMLInputElement>(null);
  const enCours = useRef<Session>({ arret: null, id: null });

  useEffect(() => {
    if (!envoi) return;
    const retenir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", retenir);
    return () => window.removeEventListener("beforeunload", retenir);
  }, [envoi]);

  useEffect(() => {
    const session = enCours.current;
    return () => {
      session.arret?.abort();
      if (session.id) void abandonner(session.id);
    };
  }, []);

  const choisir = async (e: ChangeEvent<HTMLInputElement>) => {
    const video = e.target.files?.[0];
    e.target.value = "";
    const session = enCours.current;
    if (!video || session.arret) return;
    setErreur(null);

    if (!formatVideo(video.name)) {
      setErreur(
        "Format non pris en charge : choisissez une vidéo MP4, WebM ou MOV.",
      );
      return;
    }
    if (video.size > PLAFOND_VIDEO) {
      setErreur(
        `Cette vidéo pèse ${poidsLisible(video.size)} : la limite est de 1 Go.`,
      );
      return;
    }
    if (!video.size) {
      setErreur("Ce fichier est vide.");
      return;
    }

    const arret = new AbortController();
    session.arret = arret;
    session.id = null;
    setEnvoi({ nom: video.name, taille: video.size, envoye: 0 });
    try {
      await envoyer(video, memberId, session, arret.signal, (envoye) =>
        setEnvoi((v) => (v ? { ...v, envoye } : v)),
      );
      router.refresh();
    } catch (cause) {
      if (session.id) void abandonner(session.id);
      if (!arret.signal.aborted) {
        setErreur(
          cause instanceof Refus
            ? cause.message
            : "L’envoi n’a pas abouti. Vérifiez votre connexion, puis réessayez.",
        );
      }
    } finally {
      session.arret = null;
      session.id = null;
      setEnvoi(null);
    }
  };

  const annuler = () => enCours.current.arret?.abort();

  if (!fichier && !gestion) return null;

  const pourcent = envoi
    ? Math.min(100, Math.floor((envoi.envoye / envoi.taille) * 100))
    : 0;

  return (
    <div className={`w-full ${className}`}>
      {fichier ? <Lecteur fichier={fichier} nom={nom} /> : null}

      {gestion ? (
        <div className={fichier ? "mt-2.5" : "xl:w-[280px]"}>
          <input
            ref={choix}
            type="file"
            accept={ACCEPT_VIDEO}
            className="hidden"
            onChange={choisir}
          />

          {envoi ? (
            <div
              className="rounded-[var(--radius-m)] border border-line bg-surface-2 px-3.5 py-3"
              role="status"
            >
              <div className="flex items-baseline justify-between gap-3 text-[12.8px]">
                <span className="min-w-0 truncate font-semibold text-ink">
                  {envoi.nom}
                </span>
                <span className="shrink-0 tabular-nums text-muted">
                  {pourcent} %
                </span>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"
                role="progressbar"
                aria-label="Envoi de la vidéo"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pourcent}
              >
                <div
                  className="h-full rounded-full bg-success transition-[width] duration-300"
                  style={{ width: `${pourcent}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-faint">
                <span>
                  {poidsLisible(envoi.envoye)} sur {poidsLisible(envoi.taille)}{" "}
                  · gardez cette page ouverte
                </span>
                <button
                  type="button"
                  onClick={annuler}
                  className="cursor-pointer border-0 bg-transparent p-0 text-[12px] font-semibold text-muted hover:text-bad hover:underline"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : fichier ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => choix.current?.click()}
                className={BOUTON}
              >
                <RefreshCw size={13} /> Remplacer la vidéo
              </button>
              <RetirerVideo memberId={memberId} retour={gestion} />
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => choix.current?.click()}
                className={BOUTON}
              >
                <Plus size={13} /> Ajouter une vidéo de présentation
              </button>
              <p className="m-0 mt-1.5 text-[11.8px] leading-snug text-faint">
                Facultatif. MP4 de préférence, 1 Go au plus.
              </p>
            </>
          )}

          {erreur ? (
            <p
              role="alert"
              className="m-0 mt-2 text-[12.5px] font-semibold text-bad"
            >
              {erreur}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Lecteur({ fichier, nom }: { fichier: string; nom: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [lancee, setLancee] = useState(false);

  const lire = () => {
    setLancee(true);
    void video.current?.play().catch(() => {});
  };

  const pleinEcran = () => {
    const v = video.current as VideoPleinEcran | null;
    if (!v) return;
    sansBruit(() =>
      v.requestFullscreen ? v.requestFullscreen() : v.webkitEnterFullscreen?.(),
    );
    lire();
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-m)] bg-[#0f1d2c]">
      <video
        ref={video}
        key={fichier}
        src={`${urlVideo(fichier)}#t=0.1`}
        preload="metadata"
        playsInline
        controls={lancee}
        controlsList="nodownload"
        aria-label={`Vidéo de présentation de ${nom}`}
        className="h-full w-full bg-black object-contain"
      />

      {lancee ? null : (
        <button
          type="button"
          onClick={lire}
          aria-label={`Lire la vidéo de présentation de ${nom}`}
          className="group absolute inset-0 flex cursor-pointer items-center justify-center border-0 bg-[#0f1d2c]/25 p-0 transition-colors hover:bg-[#0f1d2c]/45"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-accent shadow-[0_6px_20px_-6px_rgb(0_0_0/0.6)] transition-transform group-hover:scale-110">
            <Play size={24} fill="currentColor" className="ml-1" />
          </span>
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#0f1d2c]/80 px-2.5 py-1 text-[11.5px] font-semibold text-white">
            <Video size={12} aria-hidden /> Vidéo de présentation
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={pleinEcran}
        aria-label="Voir la vidéo en plein écran"
        title="Plein écran"
        className="absolute right-2.5 top-2.5 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-[#0f1d2c]/80 px-3 text-[11.5px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-[#0f1d2c]"
      >
        <Maximize2 size={13} aria-hidden /> Plein écran
      </button>
    </div>
  );
}

type VideoPleinEcran = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

function sansBruit(demande: () => Promise<void> | void | undefined) {
  try {
    const suite = demande();
    if (suite instanceof Promise) suite.catch(() => {});
  } catch {}
}

function RetirerVideo({
  memberId,
  retour,
}: {
  memberId: string;
  retour: string;
}) {
  return (
    <Modal
      title="Retirer la vidéo de présentation"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          className={`${BOUTON} hover:border-bad hover:text-bad`}
        >
          <Trash2 size={13} /> Retirer
        </button>
      )}
    >
      {(fermer) => (
        <form action={retirerVideoPresentation}>
          <input type="hidden" name="memberId" value={memberId} />
          <input type="hidden" name="retour" value={retour} />
          <ModalBody>
            <p className="m-0 text-[13.6px] text-muted">
              La vidéo disparaîtra de la fiche et sera effacée. Vous pourrez en
              ajouter une autre ensuite.
            </p>
          </ModalBody>
          <ModalFooter>
            <CancelButton onClick={fermer} />
            <SubmitButton variant="danger" pendingLabel="Retrait…">
              <Trash2 size={14} /> Retirer la vidéo
            </SubmitButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}

class Refus extends Error {}

const ESSAIS = 6;

async function envoyer(
  video: File,
  memberId: string,
  session: Session,
  signal: AbortSignal,
  suivre: (envoye: number) => void,
) {
  if (!(await lisible(video))) {
    throw new Refus(
      "Ce navigateur ne sait pas lire cette vidéo. Exportez-la en MP4 (H.264), puis réessayez.",
    );
  }
  signal.throwIfAborted();

  const ouverture = await fetch("/api/fiche/video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId, nom: video.name, taille: video.size }),
    signal,
  });
  if (!ouverture.ok) throw new Refus(await messageDe(ouverture));
  const { id } = (await ouverture.json()) as { id: string };
  session.id = id;

  let position = 0;
  let echecs = 0;
  while (position < video.size) {
    signal.throwIfAborted();
    const fin = Math.min(position + MORCEAU_VIDEO, video.size);
    const depart = position;
    const r = await envoyerMorceau(
      id,
      depart,
      video.slice(depart, fin),
      (charge) => suivre(depart + charge),
      signal,
    );
    if (r.ok) {
      position = r.recu;
      echecs = 0;
      suivre(position);
      continue;
    }
    if (r.recu === undefined && r.definitif) throw new Refus(r.erreur);

    if (++echecs >= ESSAIS) {
      throw new Refus(
        "La connexion s’est interrompue trop longtemps. Relancez l’envoi : il faudra le reprendre du début.",
      );
    }
    if (r.recu !== undefined) {
      position = r.recu;
      suivre(position);
      continue;
    }
    await attendre(Math.min(30_000, 1000 * 2 ** echecs), signal);
    position = (await etat(id, signal)) ?? position;
    suivre(position);
  }

  const cloture = await fetch(`/api/fiche/video/${id}`, {
    method: "POST",
    signal,
  });
  if (!cloture.ok) throw new Refus(await messageDe(cloture));
  session.id = null;
}

type Morceau =
  | { ok: true; recu: number }
  | { ok: false; recu: number }
  | { ok: false; recu?: undefined; definitif: true; erreur: string }
  | { ok: false; recu?: undefined; definitif: false };

function envoyerMorceau(
  id: string,
  position: number,
  morceau: Blob,
  suivre: (charge: number) => void,
  signal: AbortSignal,
): Promise<Morceau> {
  return new Promise((ok, ko) => {
    const requete = new XMLHttpRequest();
    const arreter = () => requete.abort();
    signal.addEventListener("abort", arreter, { once: true });
    const finir = (r: Morceau) => {
      signal.removeEventListener("abort", arreter);
      ok(r);
    };

    requete.upload.onprogress = (e) => suivre(e.loaded);
    requete.onload = () => {
      let corps: { recu?: unknown; erreur?: unknown } = {};
      try {
        corps = JSON.parse(requete.responseText);
      } catch {}
      const recu = typeof corps.recu === "number" ? corps.recu : undefined;
      if (requete.status === 200 && recu !== undefined) {
        finir({ ok: true, recu });
      } else if (requete.status === 409 && recu !== undefined) {
        finir({ ok: false, recu });
      } else if (requete.status >= 400 && requete.status < 500) {
        finir({
          ok: false,
          definitif: true,
          erreur:
            typeof corps.erreur === "string"
              ? corps.erreur
              : "L’envoi a été refusé.",
        });
      } else {
        finir({ ok: false, definitif: false });
      }
    };
    requete.onerror = () => finir({ ok: false, definitif: false });
    requete.ontimeout = () => finir({ ok: false, definitif: false });
    requete.onabort = () => {
      signal.removeEventListener("abort", arreter);
      ko(new DOMException("Envoi arrêté", "AbortError"));
    };

    requete.open("PUT", `/api/fiche/video/${id}?position=${position}`);
    requete.setRequestHeader("Content-Type", "application/octet-stream");
    requete.timeout = 5 * 60 * 1000;
    requete.send(morceau);
  });
}

async function etat(id: string, signal: AbortSignal): Promise<number | null> {
  try {
    const r = await fetch(`/api/fiche/video/${id}`, { signal });
    if (r.status === 404) {
      throw new Refus(await messageDe(r));
    }
    if (!r.ok) return null;
    const { recu } = (await r.json()) as { recu?: unknown };
    return typeof recu === "number" ? recu : null;
  } catch (e) {
    if (e instanceof Refus || signal.aborted) throw e;
    return null;
  }
}

async function abandonner(id: string) {
  try {
    await fetch(`/api/fiche/video/${id}`, {
      method: "DELETE",
      keepalive: true,
    });
  } catch {}
}

async function messageDe(reponse: Response): Promise<string> {
  try {
    const { erreur } = (await reponse.json()) as { erreur?: unknown };
    if (typeof erreur === "string" && erreur) return erreur;
  } catch {}
  return reponse.status === 401
    ? "Votre session a expiré : reconnectez-vous, puis relancez l’envoi."
    : "L’envoi a été refusé.";
}

function attendre(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((ok, ko) => {
    const arret = () => {
      clearTimeout(minuterie);
      ko(new DOMException("Envoi arrêté", "AbortError"));
    };
    const minuterie = setTimeout(() => {
      signal.removeEventListener("abort", arret);
      ok();
    }, ms);
    signal.addEventListener("abort", arret, { once: true });
  });
}

function lisible(video: File): Promise<boolean> {
  return new Promise((ok) => {
    const essai = document.createElement("video");
    const adresse = URL.createObjectURL(video);
    const finir = (verdict: boolean) => {
      clearTimeout(garde);
      essai.removeAttribute("src");
      essai.load();
      URL.revokeObjectURL(adresse);
      ok(verdict);
    };
    const garde = setTimeout(() => finir(true), 8000);
    essai.preload = "metadata";
    essai.muted = true;
    essai.onloadedmetadata = () => finir(essai.videoWidth > 0);
    essai.onerror = () => finir(false);
    essai.src = adresse;
  });
}
