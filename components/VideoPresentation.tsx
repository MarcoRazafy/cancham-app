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

/**
 * La présentation d'une fiche, avec sa vidéo à droite quand elle en a une.
 *
 * Sans vidéo, rien ne change pour qui consulte la fiche : la place reste
 * vide, sans encadré ni mention. Seuls le membre, sur sa propre fiche, et
 * l'équipe y trouvent de quoi en ajouter une (`gestion`).
 */
export function PresentationAvecVideo({
  memberId,
  nom,
  fichier,
  gestion,
  children,
}: {
  memberId: string;
  /** Le nom de l'entreprise, pour dire de qui est la vidéo. */
  nom: string;
  fichier?: string | null;
  /**
   * La page d'où l'on gère la vidéo — celle où revenir après un retrait.
   * Absente : la fiche est en simple consultation.
   */
  gestion?: string;
  children: ReactNode;
}) {
  if (!fichier && !gestion) return <>{children}</>;

  // Sans vidéo, il n'y a qu'un bouton pour en ajouter une : il reste
  // discret, en haut à droite.
  if (!fichier) {
    return (
      <div className="grid items-start gap-x-8 gap-y-5 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">{children}</div>
        <VideoPresentation memberId={memberId} nom={nom} gestion={gestion} />
      </div>
    );
  }

  return (
    // Deux colonnes sur grand écran seulement : entre la barre latérale et
    // une vidéo, le texte n'aurait plus la place de se lire. Sur un très
    // grand écran, le texte garde la largeur où il se lit bien, et tout le
    // reste revient à la vidéo, qui s'y centre.
    <div className="grid gap-x-8 gap-y-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] 2xl:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
      <div className="min-w-0">{children}</div>
      {/*
        La vidéo se pose dans la place libre, et non dans le coin en haut à
        droite : un peu plus bas que le nom, et un peu en retrait du bord
        droit — il lui reste à droite un petit tiers de la place libre sur un
        très grand écran, 24 px sur un écran moyen. Plus à gauche, elle
        paraissait détachée du bord sans être vraiment centrée.
        Face à une présentation plus haute qu'elle, elle se centre aussi en
        hauteur, mais dans les 440 premiers pixels seulement : derrière un
        très long texte, elle descendrait sinon hors de vue.
      */}
      <div className="min-w-0 xl:pt-10 xl:pr-6 2xl:pr-0">
        <div className="flex xl:min-h-[min(100%,440px)] xl:items-center xl:justify-center 2xl:justify-start">
          <VideoPresentation
            memberId={memberId}
            nom={nom}
            fichier={fichier}
            gestion={gestion}
            className="max-w-[520px] xl:max-w-[440px] 2xl:ml-[calc((100%-440px)*0.7)]"
          />
        </div>
      </div>
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
  /** Connu une fois l'envoi ouvert ; vidé quand la vidéo est posée. */
  id: string | null;
}

/**
 * La vidéo de présentation d'une fiche : elle se lit sur place, et passe en
 * plein écran si on le demande ; pour qui gère la fiche, de quoi l'ajouter,
 * la remplacer ou la retirer.
 *
 * L'envoi se fait par morceaux (voir `lib/video-presentation.ts`) : la barre
 * avance au fil des octets, un morceau perdu se renvoie seul, et une coupure
 * reprend où elle s'est arrêtée.
 */
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
  /** La largeur que la vidéo peut prendre, là où on la pose. */
  className?: string;
}) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState<Envoi | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const choix = useRef<HTMLInputElement>(null);
  /** L'envoi en cours : de quoi l'arrêter, et son identifiant côté serveur. */
  const enCours = useRef<Session>({ arret: null, id: null });

  // Quitter la page couperait l'envoi : le navigateur demande confirmation.
  useEffect(() => {
    if (!envoi) return;
    const retenir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", retenir);
    return () => window.removeEventListener("beforeunload", retenir);
  }, [envoi]);

  // La fiche quittée, l'envoi s'arrête et ce qui était arrivé est effacé.
  useEffect(() => {
    // Le même objet du début à la fin : seuls ses champs changent.
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
      // La fiche se recharge avec sa vidéo.
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

/**
 * La vidéo de la fiche, lue sur place.
 *
 * Au repos, sa première image sert d'affiche, sous un bouton de lecture. Un
 * clic la lance là où elle est, avec les commandes du navigateur — sans
 * prendre tout l'écran : on reste sur la fiche. Le plein écran se demande,
 * par le bouton posé dans le coin ; on en sort par Échap ou par les
 * commandes du lecteur.
 */
function Lecteur({ fichier, nom }: { fichier: string; nom: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [lancee, setLancee] = useState(false);

  const lire = () => {
    setLancee(true);
    // Un refus du navigateur n'est pas une panne : les commandes sont là.
    void video.current?.play().catch(() => {});
  };

  const pleinEcran = () => {
    const v = video.current as VideoPleinEcran | null;
    if (!v) return;
    // Dans le geste même du clic : un navigateur n'accorde le plein écran
    // qu'à une action de la personne. L'iPhone n'a que le sien, propre à la
    // vidéo.
    sansBruit(() =>
      v.requestFullscreen ? v.requestFullscreen() : v.webkitEnterFullscreen?.(),
    );
    lire();
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-m)] bg-[#0f1d2c]">
      {/*
        `#t=0.1` fait venir la première image aussi sur iPhone, qui sinon
        laisse le cadre noir ; `metadata` ne télécharge que de quoi la
        montrer, le reste vient à la lecture.
      */}
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

/** Le plein écran propre à la vidéo, sur iPhone : le seul qu'il connaisse. */
type VideoPleinEcran = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

/**
 * Demande le plein écran sans que le refus fasse de bruit : selon le
 * navigateur, l'appel rend une promesse, rien du tout, ou lève.
 */
function sansBruit(demande: () => Promise<void> | void | undefined) {
  try {
    const suite = demande();
    if (suite instanceof Promise) suite.catch(() => {});
  } catch {
    // Pas de plein écran ici : la vidéo se lit sur place.
  }
}

/** Le retrait de la vidéo, après confirmation. */
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

/* ============================ L'envoi ============================ */

/** Un refus à montrer tel quel : il dit quoi faire. */
class Refus extends Error {}

/** Combien de fois de suite on retente un morceau avant de renoncer. */
const ESSAIS = 6;

/**
 * Envoie la vidéo : vérification, ouverture, morceaux, clôture.
 *
 * Lève `Refus` pour ce que la personne doit savoir, une autre erreur pour
 * une panne. Un arrêt demandé lève aussi : à l'appelant de regarder le
 * signal.
 */
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
      // Le serveur dit où il en est : on repart de là, sans attendre.
      position = r.recu;
      suivre(position);
      continue;
    }
    // Une coupure : on attend un peu, de plus en plus, puis on demande au
    // serveur où il en est avant de reprendre.
    await attendre(Math.min(30_000, 1000 * 2 ** echecs), signal);
    position = (await etat(id, signal)) ?? position;
    suivre(position);
  }

  const cloture = await fetch(`/api/fiche/video/${id}`, {
    method: "POST",
    signal,
  });
  if (!cloture.ok) throw new Refus(await messageDe(cloture));
  // La vidéo est posée : il n'y a plus rien à abandonner.
  session.id = null;
}

type Morceau =
  | { ok: true; recu: number }
  | { ok: false; recu: number }
  | { ok: false; recu?: undefined; definitif: true; erreur: string }
  | { ok: false; recu?: undefined; definitif: false };

/** Un morceau, avec le suivi des octets partis. Ne lève que sur un arrêt. */
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
      } catch {
        // Une réponse qui n'est pas la nôtre : un intermédiaire, une panne.
      }
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
    // Un morceau qui n'avance plus du tout finit par être repris.
    requete.timeout = 5 * 60 * 1000;
    requete.send(morceau);
  });
}

/** Où en est le serveur, après une coupure. `null` s'il ne répond pas. */
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

/** Efface, côté serveur, ce qui était arrivé d'un envoi qu'on abandonne. */
async function abandonner(id: string) {
  try {
    await fetch(`/api/fiche/video/${id}`, {
      method: "DELETE",
      keepalive: true,
    });
  } catch {
    // Le ménage du serveur s'en chargera.
  }
}

async function messageDe(reponse: Response): Promise<string> {
  try {
    const { erreur } = (await reponse.json()) as { erreur?: unknown };
    if (typeof erreur === "string" && erreur) return erreur;
  } catch {
    // Pas de message : on en donne un.
  }
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

/**
 * Le navigateur sait-il lire cette vidéo ?
 *
 * Mieux vaut le savoir avant d'envoyer un gigaoctet : un fichier d'iPhone
 * en HEVC, par exemple, porte le bon nom et ne se lit pas partout. On charge
 * ses seules métadonnées, sur place. Dans le doute — un navigateur qui ne
 * répond pas —, on laisse passer : le serveur contrôle de son côté que le
 * fichier est bien une vidéo.
 */
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
