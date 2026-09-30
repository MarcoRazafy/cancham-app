"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Download, Share, SquarePlus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ModalBody } from "@/components/form-bits";

/**
 * L'application CanCham installée : ce qui la distingue du site ouvert
 * dans un navigateur.
 *
 * - `useDansApplication` dit si l'on tourne dans l'application installée ;
 * - `EnregistrementApplication` inscrit le service worker (la page « hors
 *   ligne ») ;
 * - `BoutonInstaller` propose l'installation depuis les espaces ;
 * - `LienSite` et `RenvoiApplication` gardent la vitrine hors de
 *   l'application.
 */

/* ------------------------- Le mode « installée » ------------------------ */

const EN_APPLICATION = "(display-mode: standalone)";

function suivreMode(rappel: () => void) {
  const requete = window.matchMedia(EN_APPLICATION);
  requete.addEventListener("change", rappel);
  return () => requete.removeEventListener("change", rappel);
}

/** Vrai dans l'application installée. Hors composant : voir `useDansApplication`. */
export function lireMode(): boolean {
  return (
    window.matchMedia(EN_APPLICATION).matches ||
    // Safari sur iPhone signale l'écran d'accueil à sa façon.
    (navigator as { standalone?: boolean }).standalone === true
  );
}

/** Vrai dans l'application installée ; faux dans un navigateur, et au rendu serveur. */
export function useDansApplication(): boolean {
  return useSyncExternalStore(suivreMode, lireMode, () => false);
}

/* -------------------- L'invitation du navigateur ------------------------ */

/**
 * Chrome, Edge et Android annoncent qu'on peut installer par l'événement
 * `beforeinstallprompt`. On le garde pour le rejouer au clic sur notre
 * bouton — et l'on retient la petite bannière du navigateur, pour qu'il n'y
 * ait qu'une seule invitation, la nôtre, et seulement dans les espaces.
 *
 * L'écoute est posée dès le chargement du module, avant même l'affichage :
 * l'événement peut arriver tôt, et un bouton qui l'aurait manqué ne
 * s'afficherait jamais.
 */
interface InvitationInstallation extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let invitation: InvitationInstallation | null = null;
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((rappel) => rappel());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (evenement) => {
    evenement.preventDefault();
    invitation = evenement as InvitationInstallation;
    prevenir();
  });
  window.addEventListener("appinstalled", () => {
    invitation = null;
    prevenir();
  });
}

function suivreInvitation(rappel: () => void) {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
}

/**
 * Là où il n'y a pas d'invitation automatique, on explique le geste :
 * l'iPhone et l'iPad passent par « Partager », Safari sur Mac par le menu
 * Fichier. Firefox sur ordinateur n'installe pas d'application : rien à
 * proposer.
 */
type Consigne = "ios" | "mac" | null;

export function lireConsigne(): Consigne {
  const ua = navigator.userAgent;
  const ipad =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/i.test(ua) || ipad) return "ios";
  if (
    /macintosh/i.test(ua) &&
    /safari/i.test(ua) &&
    !/chrome|chromium|edg|firefox/i.test(ua)
  ) {
    return "mac";
  }
  return null;
}

/* ----------------------------- Le service worker ----------------------- */

/** Inscrit le service worker, une fois, pour toutes les pages. */
export function EnregistrementApplication() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Sans service worker, tout fonctionne encore — sauf la page hors ligne.
      });
  }, []);
  return null;
}

/* ----------------------------- Le bouton ------------------------------- */

/**
 * « Installer l'application », dans la barre du haut des espaces.
 *
 * Il n'apparaît que lorsqu'on peut réellement installer — jamais dans
 * l'application elle-même, ni dans un navigateur qui ne le permet pas. Sur
 * Chrome et Android, un clic ouvre la fenêtre d'installation du système ;
 * sur iPhone, iPad et Safari pour Mac, il montre les gestes à faire.
 */
export function BoutonInstaller() {
  const dansApplication = useDansApplication();
  const inv = useSyncExternalStore(
    suivreInvitation,
    () => invitation,
    () => null,
  );
  const consigne = useSyncExternalStore(
    () => () => {},
    lireConsigne,
    () => null,
  );
  const [aide, setAide] = useState(false);

  if (dansApplication || (!inv && !consigne)) return null;

  const installer = async () => {
    if (!inv) {
      setAide(true);
      return;
    }
    await inv.prompt();
    await inv.userChoice;
    // L'invitation ne sert qu'une fois ; le navigateur en renverra une
    // autre s'il le juge utile.
    invitation = null;
    prevenir();
  };

  return (
    <>
      <button
        type="button"
        onClick={installer}
        title="Installer l’application CanCham"
        aria-label="Installer l’application CanCham"
        className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Download size={16} aria-hidden />
        <span className="hidden sm:inline">Installer l’application</span>
      </button>

      {consigne ? (
        <Modal
          title="Installer l’application"
          ouvert={aide}
          onFermer={() => setAide(false)}
        >
          {() => (
            <ModalBody>
              <p className="m-0 text-[14px] text-muted">
                L’application CanCham s’ajoute à vos applications, avec son
                icône : elle s’ouvre directement sur votre espace.
              </p>
              {consigne === "ios" ? (
                <ol className="m-0 flex list-none flex-col gap-3 p-0">
                  <Etape n={1}>
                    Touchez le bouton{" "}
                    <b className="inline-flex items-center gap-1">
                      Partager <Share size={15} aria-hidden />
                    </b>{" "}
                    de Safari — en bas de l’écran sur iPhone, en haut sur iPad.
                  </Etape>
                  <Etape n={2}>
                    Choisissez{" "}
                    <b className="inline-flex items-center gap-1">
                      Sur l’écran d’accueil <SquarePlus size={15} aria-hidden />
                    </b>
                    .
                  </Etape>
                  <Etape n={3}>
                    Touchez <b>Ajouter</b> : l’icône CanCham rejoint vos
                    applications.
                  </Etape>
                </ol>
              ) : (
                <ol className="m-0 flex list-none flex-col gap-3 p-0">
                  <Etape n={1}>
                    Dans la barre des menus de Safari, ouvrez <b>Fichier</b>.
                  </Etape>
                  <Etape n={2}>
                    Choisissez <b>Ajouter au Dock</b>, puis confirmez.
                  </Etape>
                </ol>
              )}
            </ModalBody>
          )}
        </Modal>
      ) : null}
    </>
  );
}

function Etape({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3 text-[14.5px] leading-snug text-ink">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[13px] font-bold text-accent">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

/* ---------------------- La vitrine, hors de l'application --------------- */

/**
 * Un lien vers le site public — le logo de la page de connexion. Dans
 * l'application, il n'emmène nulle part : l'application ne montre pas le
 * site.
 */
export function LienSite({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const dansApplication = useDansApplication();
  if (dansApplication) return <span className={className}>{children}</span>;
  return (
    <Link href="/" aria-label="CanCham Connect" className={className}>
      {children}
    </Link>
  );
}

/**
 * Posé dans la mise en page de la vitrine : ouverte dans l'application —
 * un lien reçu par WhatsApp que le téléphone y envoie —, une page du site
 * renvoie vers son équivalent dans l'espace membre. Un événement vers sa
 * fiche membre, une actualité vers la sienne ; le reste vers la connexion,
 * qui mène elle-même à l'espace de chacun.
 */
export function RenvoiApplication() {
  const dansApplication = useDansApplication();
  const chemin = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!dansApplication) return;
    const evenement = chemin.match(/^\/evenements\/([^/]+)/);
    const actualite = chemin.match(/^\/actualites\/([^/]+)/);
    router.replace(
      evenement
        ? `/membre/evenements/${evenement[1]}`
        : actualite
          ? `/membre/actualites/${actualite[1]}`
          : "/auth",
    );
  }, [dansApplication, chemin, router]);

  return null;
}
