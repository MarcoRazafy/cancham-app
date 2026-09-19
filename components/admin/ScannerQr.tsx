"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import jsQR from "jsqr";
import {
  CameraOff,
  CheckCircle2,
  CircleAlert,
  Info,
  Keyboard,
  ScanLine,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { pointerParCode, type ResultatScan } from "@/lib/actions/events";

/**
 * Scanner de QR codes à l'accueil d'un événement.
 *
 * La caméra du téléphone ou de l'ordinateur lit le QR code du billet d'un
 * membre ; la personne passe « présente » aussitôt, et le scanner reste
 * ouvert pour la suivante. Chaque lecture s'affiche : arrivée enregistrée,
 * déjà pointée, ou code refusé — inconnu, d'un autre événement.
 *
 * Le décodage se fait dans le navigateur : le détecteur natif quand il existe
 * (Chrome sur Android, macOS), sinon jsQR sur une image réduite de la vidéo.
 * Sans caméra — ordinateur de bureau, permission refusée —, le code se saisit
 * à la main.
 */

/**
 * Un code qui reste devant l'objectif n'est lu qu'une fois : il faut qu'il
 * sorte du champ pendant ce délai pour être relu.
 */
const REPOS_MS = 2500;
/** Intervalle entre deux analyses d'image. */
const CADENCE_MS = 160;
/** Largeur de l'image analysée : assez pour lire, assez petite pour aller vite. */
const LARGEUR_ANALYSE = 640;

interface Detecteur {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

export function ScannerQr({
  eventId,
  termine,
}: {
  eventId: string;
  /** Événement terminé : la caméra n'a plus lieu de s'ouvrir. */
  termine: boolean;
}) {
  return (
    <Modal
      title="Scanner les QR codes"
      largeur="max-w-[560px]"
      trigger={(ouvrir) => (
        <button
          type="button"
          onClick={ouvrir}
          disabled={termine}
          title={termine ? "L’événement est terminé" : undefined}
          className="btn-action btn-action-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ScanLine size={15} /> Scanner les QR codes
        </button>
      )}
    >
      {() => <Lecteur eventId={eventId} />}
    </Modal>
  );
}

function Lecteur({ eventId }: { eventId: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<"demarrage" | "active" | "indisponible">(
    "demarrage",
  );
  const [motif, setMotif] = useState("");
  const [resultats, setResultats] = useState<(ResultatScan & { id: number })[]>(
    [],
  );
  const [saisie, setSaisie] = useState("");
  const [enCours, demarrer] = useTransition();

  const occupe = useRef(false);
  /** Dernier code vu par la caméra, et quand il l'a été pour la dernière fois. */
  const derniere = useRef<{ code: string; vu: number } | null>(null);
  const compteur = useRef(0);

  /** Envoie un code lu ou saisi, et affiche le résultat en tête. */
  const pointer = useCallback(
    (lu: string) => {
      const code = lu.trim();
      if (!code || occupe.current) return;
      occupe.current = true;
      demarrer(async () => {
        try {
          const r = await pointerParCode(eventId, code);
          setResultats((liste) =>
            [{ ...r, id: ++compteur.current }, ...liste].slice(0, 6),
          );
          if (r.etat === "present") navigator.vibrate?.(90);
          else if (r.etat === "erreur") navigator.vibrate?.([60, 60, 60]);
        } catch {
          setResultats((liste) =>
            [
              {
                etat: "erreur" as const,
                code,
                message: "Le pointage n’a pas abouti. Réessayez.",
                id: ++compteur.current,
              },
              ...liste,
            ].slice(0, 6),
          );
        } finally {
          occupe.current = false;
        }
      });
    },
    [eventId],
  );

  /* ---------- Caméra et lecture ---------- */

  useEffect(() => {
    let flux: MediaStream | null = null;
    let minuterie: ReturnType<typeof setTimeout> | undefined;
    let arrete = false;

    const toile = document.createElement("canvas");
    const ctx = toile.getContext("2d", { willReadFrequently: true });
    const Natif = (
      window as unknown as {
        BarcodeDetector?: new (o: { formats: string[] }) => Detecteur;
      }
    ).BarcodeDetector;
    const natif = Natif ? new Natif({ formats: ["qr_code"] }) : null;

    const analyser = async () => {
      if (arrete) return;
      const v = video.current;
      if (v && v.readyState >= 2 && v.videoWidth && !occupe.current) {
        try {
          let lu: string | null = null;
          if (natif) {
            lu = (await natif.detect(v))[0]?.rawValue ?? null;
          } else if (ctx) {
            const echelle = Math.min(1, LARGEUR_ANALYSE / v.videoWidth);
            toile.width = Math.round(v.videoWidth * echelle);
            toile.height = Math.round(v.videoHeight * echelle);
            ctx.drawImage(v, 0, 0, toile.width, toile.height);
            const image = ctx.getImageData(0, 0, toile.width, toile.height);
            lu =
              jsQR(image.data, toile.width, toile.height, {
                inversionAttempts: "dontInvert",
              })?.data ?? null;
          }
          if (lu) {
            const code = lu.trim();
            const vu = derniere.current;
            if (vu && vu.code === code && Date.now() - vu.vu < REPOS_MS) {
              // Toujours le même billet devant l'objectif : déjà traité.
              vu.vu = Date.now();
            } else {
              derniere.current = { code, vu: Date.now() };
              pointer(code);
            }
          }
        } catch {
          /* Image illisible : on passe à la suivante. */
        }
      }
      minuterie = setTimeout(analyser, CADENCE_MS);
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamera("indisponible");
        setMotif(
          "La caméra n’est accessible que sur une adresse sécurisée (https) ou sur cet ordinateur.",
        );
        return;
      }
      try {
        flux = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (arrete) {
          flux.getTracks().forEach((p) => p.stop());
          return;
        }
        const v = video.current;
        if (v) {
          v.srcObject = flux;
          await v.play().catch(() => {});
        }
        setCamera("active");
        analyser();
      } catch (e) {
        setCamera("indisponible");
        setMotif(
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "L’accès à la caméra a été refusé. Autorisez-le dans le navigateur, ou saisissez le code."
            : "Aucune caméra disponible. Saisissez le code du billet.",
        );
      }
    })();

    // La caméra s'éteint dès que la fenêtre se ferme.
    return () => {
      arrete = true;
      clearTimeout(minuterie);
      flux?.getTracks().forEach((p) => p.stop());
    };
  }, [pointer]);

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* ---------- Vidéo ---------- */}
      <div className="relative aspect-[4/3] rounded-[var(--radius-m)] overflow-hidden bg-[#0f1d2c]">
        <video
          ref={video}
          muted
          playsInline
          className={`w-full h-full object-cover ${camera === "active" ? "" : "invisible"}`}
        />
        {camera === "active" ? (
          // Le cadre de visée : il dit où placer le code.
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-[58%] aspect-square rounded-2xl border-[3px] border-white/85 shadow-[0_0_0_9999px_rgba(15,29,44,0.45)]" />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/85 text-center px-8">
            {camera === "demarrage" ? (
              <>
                <ScanLine size={30} />
                <span className="text-[13.5px]">Ouverture de la caméra…</span>
              </>
            ) : (
              <>
                <CameraOff size={30} />
                <span className="text-[13.5px] leading-relaxed">{motif}</span>
              </>
            )}
          </div>
        )}
        {enCours ? (
          <span className="absolute top-3 left-3 text-[12px] font-semibold text-white bg-black/50 rounded-full px-3 py-1">
            Pointage…
          </span>
        ) : null}
      </div>

      <p className="m-0 text-[12.8px] text-muted text-center">
        Placez le QR code du billet dans le cadre : la personne est pointée
        présente dès la lecture.
      </p>

      {/* ---------- Saisie manuelle ---------- */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          pointer(saisie);
          setSaisie("");
        }}
        className="flex gap-2"
      >
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Code du billet</span>
          <Keyboard
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
          />
          <input
            value={saisie}
            onChange={(e) => setSaisie(e.target.value.toUpperCase())}
            placeholder="Ou saisissez le code : CC-E1-4040"
            autoCapitalize="characters"
            className="w-full rounded-[var(--radius-s)] border border-line bg-surface text-ink pl-9 pr-3 py-2.5 text-[13.5px] font-[family-name:var(--font-mono)] outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={!saisie.trim() || enCours}
          className="btn-contour btn-contour-sm disabled:opacity-50"
        >
          Valider
        </button>
      </form>

      {/* ---------- Dernières lectures ---------- */}
      {resultats.length ? (
        <ul aria-live="polite" className="list-none m-0 p-0 flex flex-col gap-2">
          {resultats.map((r, i) => (
            <li
              key={r.id}
              className={`flex items-start gap-3 rounded-[var(--radius-s)] px-3.5 py-2.5 text-[13px] ${
                r.etat === "present"
                  ? "bg-success-soft text-success-strong"
                  : r.etat === "deja"
                    ? "bg-warn-soft text-warn"
                    : "bg-bad-soft text-bad"
              } ${i ? "opacity-70" : ""}`}
            >
              {r.etat === "present" ? (
                <CheckCircle2 size={18} className="shrink-0 mt-px" />
              ) : r.etat === "deja" ? (
                <Info size={18} className="shrink-0 mt-px" />
              ) : (
                <CircleAlert size={18} className="shrink-0 mt-px" />
              )}
              <span className="min-w-0">
                {r.etat === "erreur" ? (
                  <>
                    <b className="font-semibold">{r.code || "Code illisible"}</b>{" "}
                    — {r.message}
                  </>
                ) : (
                  <>
                    <b className="font-semibold">{r.nom}</b>
                    {r.entreprise ? ` · ${r.entreprise}` : ""} —{" "}
                    {r.etat === "present" ? "présent" : "déjà pointé présent"}
                    <span className="block text-[11.5px] opacity-80 font-[family-name:var(--font-mono)]">
                      {r.code}
                    </span>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
