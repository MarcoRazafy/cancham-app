"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
} from "react";
import { Check, LoaderCircle, TriangleAlert } from "lucide-react";

/**
 * Les envois de fichiers, suivis au pourcentage.
 *
 * Un formulaire envoyé d'un bloc ne dit rien de sa progression : sur une
 * connexion lente, on ne sait pas si la photo part, ni combien il reste.
 * Chaque fichier part donc dès qu'on le choisit, vers `/api/televersements`,
 * qui répond par un jeton ; le formulaire renvoie ce jeton à la place du
 * fichier, et son enregistrement devient instantané.
 *
 * Rien ne se perd pour autant : tant que tous les jetons ne sont pas
 * arrivés, le champ garde son nom et ses fichiers — un formulaire validé
 * avant la fin, ou un envoi qui échoue, repart simplement comme avant, le
 * fichier dans le formulaire.
 */

export interface Envoi {
  nom: string;
  image: boolean;
  taille: number;
  envoye: number;
  jeton: string | null;
  erreur: boolean;
  termine: boolean;
  /** Terminé depuis un instant : l'indicateur commun ne le montre plus. */
  masque: boolean;
}

let prochain = 0;
const envois = new Map<number, Envoi & { requete: XMLHttpRequest }>();
const identifiants = new WeakMap<File, number>();
const abonnes = new Set<() => void>();
let version = 0;
const prevenir = () => {
  version++;
  abonnes.forEach((rappel) => rappel());
};
const suivre = (rappel: () => void) => {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
};

/** Lance l'envoi d'un fichier — une seule fois, même demandé deux fois. */
function envoyer(fichier: File): number {
  const connu = identifiants.get(fichier);
  if (connu !== undefined) return connu;

  const id = prochain++;
  identifiants.set(fichier, id);
  const requete = new XMLHttpRequest();
  const envoi: Envoi & { requete: XMLHttpRequest } = {
    nom: fichier.name,
    image: fichier.type.startsWith("image/"),
    taille: fichier.size,
    envoye: 0,
    jeton: null,
    erreur: false,
    termine: false,
    masque: false,
    requete,
  };
  envois.set(id, envoi);

  const finir = (jeton: string | null) => {
    envoi.jeton = jeton;
    envoi.erreur = !jeton;
    envoi.envoye = jeton ? envoi.taille : envoi.envoye;
    envoi.termine = true;
    prevenir();
    // « Photo prête » reste un instant, puis la pastille s'efface.
    setTimeout(() => {
      envoi.masque = true;
      prevenir();
    }, 2500);
  };
  requete.upload.onprogress = (e) => {
    if (!e.lengthComputable) return;
    envoi.envoye = e.loaded;
    prevenir();
  };
  requete.onload = () => {
    try {
      finir(
        requete.status === 200 ? JSON.parse(requete.responseText).jeton : null,
      );
    } catch {
      finir(null);
    }
  };
  requete.onerror = () => finir(null);
  requete.onabort = () => {
    envois.delete(id);
    prevenir();
  };

  requete.open("POST", "/api/televersements");
  requete.setRequestHeader(
    "Content-Type",
    fichier.type || "application/octet-stream",
  );
  requete.setRequestHeader("X-Nom-Fichier", encodeURIComponent(fichier.name));
  requete.send(fichier);
  prevenir();
  return id;
}

/** Arrête l'envoi d'un fichier retiré avant la fin. */
function abandonner(fichier: File) {
  const id = identifiants.get(fichier);
  if (id === undefined) return;
  const envoi = envois.get(id);
  identifiants.delete(fichier);
  if (envoi && !envoi.termine) envoi.requete.abort();
}

export function pourcentage(e: Envoi): number {
  return e.taille ? Math.min(100, Math.round((e.envoye / e.taille) * 100)) : 0;
}

/**
 * Suit l'envoi d'une liste de fichiers : chacun part dès qu'il y figure, et
 * s'arrête s'il en sort avant la fin. `prets` vaut vrai quand tous ont leur
 * jeton — le champ peut alors les remplacer.
 */
export function useEnvois(fichiers: File[]): {
  etats: (Envoi | null)[];
  jetons: string[] | null;
} {
  useSyncExternalStore(
    suivre,
    () => version,
    () => 0,
  );
  const precedents = useRef<File[]>([]);

  useEffect(() => {
    fichiers.forEach(envoyer);
    for (const f of precedents.current) {
      if (!fichiers.includes(f)) abandonner(f);
    }
    precedents.current = fichiers;
  }, [fichiers]);

  const etats = fichiers.map((f) => {
    const id = identifiants.get(f);
    return id === undefined ? null : (envois.get(id) ?? null);
  });
  const jetons = etats.every((e) => e?.jeton)
    ? etats.map((e) => e!.jeton!)
    : null;
  return { etats, jetons: fichiers.length ? jetons : null };
}

/**
 * Les jetons à la place des fichiers, une fois tous arrivés. À poser juste
 * à côté du champ fichier, dont on retire alors le nom.
 */
export function JetonsEnvoyes({
  name,
  jetons,
}: {
  name: string;
  jetons: string[] | null;
}) {
  return jetons?.map((j) => (
    <input key={j} type="hidden" name={name} value={j} />
  ));
}

/**
 * Un champ fichier dont les fichiers partent dès qu'on les choisit.
 *
 * S'utilise comme `<input type="file">` : mêmes attributs, même
 * `onChange`. Le pourcentage s'affiche dans l'indicateur commun, en bas de
 * l'écran.
 */
export function EntreeFichier({
  name,
  onChange,
  ...attributs
}: Omit<ComponentProps<"input">, "type" | "name"> & { name: string }) {
  const [fichiers, setFichiers] = useState<File[]>([]);
  const { jetons } = useEnvois(fichiers);
  return (
    <>
      <input
        type="file"
        {...attributs}
        name={jetons ? undefined : name}
        onChange={(e) => {
          setFichiers(Array.from(e.target.files ?? []));
          onChange?.(e);
        }}
      />
      <JetonsEnvoyes name={name} jetons={jetons} />
    </>
  );
}

/**
 * L'indicateur commun : une pastille en bas de l'écran, tant qu'un envoi
 * est en cours, puis un instant pour dire qu'il est fini.
 */
export function IndicateurEnvois() {
  useSyncExternalStore(
    suivre,
    () => version,
    () => 0,
  );
  const visibles = [...envois.values()].filter((e) => !e.masque);
  const enCours = visibles.filter((e) => !e.termine);
  const echec = visibles.some((e) => e.erreur);

  if (!visibles.length) return null;

  const total = visibles.reduce((s, e) => s + e.taille, 0);
  const envoye = visibles.reduce((s, e) => s + e.envoye, 0);
  const pct = total ? Math.min(100, Math.round((envoye / total) * 100)) : 0;
  const quoi =
    visibles.length > 1
      ? `${visibles.length} fichiers`
      : visibles[0].image
        ? "la photo"
        : "le fichier";

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-24 left-1/2 z-[210] w-[min(360px,92vw)] -translate-x-1/2 rounded-[14px] bg-[#0f1d2c] px-4 py-3 text-white shadow-[0_18px_40px_-18px_rgba(15,29,44,0.8)] print:hidden"
    >
      <div className="flex items-center gap-2.5 text-[13.5px] font-semibold">
        {enCours.length ? (
          <LoaderCircle
            size={16}
            className="shrink-0 animate-spin"
            aria-hidden
          />
        ) : echec ? (
          <TriangleAlert
            size={16}
            className="shrink-0 text-[#ffcf66]"
            aria-hidden
          />
        ) : (
          <Check size={16} className="shrink-0 text-[#7ee2a8]" aria-hidden />
        )}
        <span className="min-w-0 flex-1 truncate">
          {enCours.length
            ? `Envoi de ${quoi}…`
            : echec
              ? "Envoi interrompu : il repartira avec le formulaire."
              : visibles.length > 1
                ? "Fichiers prêts"
                : visibles[0].image
                  ? "Photo prête"
                  : "Fichier prêt"}
        </span>
        <span className="shrink-0 tabular-nums">{pct} %</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-[#7ee2a8] transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
