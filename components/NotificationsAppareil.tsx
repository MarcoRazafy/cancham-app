"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { BellRing, Smartphone } from "lucide-react";
import { lireConsigne, lireMode } from "@/components/Application";

/**
 * « Recevoir les notifications sur cet appareil », au pied de la cloche.
 *
 * Un clic demande l'autorisation au navigateur, abonne l'appareil aux
 * notifications (Web Push) et rattache l'abonnement à la personne connectée.
 * Elle reçoit dès lors messages, factures et événements sur son téléphone ou
 * son ordinateur, application fermée ou non. « Essayer » s'envoie une
 * notification pour vérifier ; « Désactiver » retire l'abonnement.
 *
 * Ce que le navigateur permet se lit une fois, à l'affichage : adresse
 * sans https (un téléphone qui ouvre le serveur de développement), pas de
 * notifications possibles, iPhone sans l'application installée, ou
 * notifications bloquées. Le reste — abonné ou non — se vérifie auprès du
 * service worker.
 */

type Support =
  | "inconnu"
  | "non-securise"
  | "absent"
  | "ios"
  | "refuse"
  | "possible";
type Etat = "inconnu" | "inactif" | "actif" | "refuse";

function lireSupport(): Support {
  // Les navigateurs n'accordent service worker et notifications qu'aux
  // adresses sûres : https, ou localhost sur la machine même.
  if (!window.isSecureContext) return "non-securise";
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  )
    return "absent";
  // Sur iPhone et iPad, seule l'application installée reçoit des notifications.
  if (lireConsigne() === "ios" && !lireMode()) return "ios";
  if (Notification.permission === "denied") return "refuse";
  return "possible";
}

/** L'abonnement du navigateur, s'il en a un. */
async function abonnementCourant(): Promise<PushSubscription | null> {
  const inscription = await navigator.serviceWorker.ready;
  return inscription.pushManager.getSubscription();
}

/** La clé VAPID en octets : c'est ainsi que `subscribe` la veut. */
function cleEnOctets(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/** Le navigateur et le système, pour reconnaître l'appareil. */
function nomAppareil(): string {
  const ua = navigator.userAgent;
  const systeme = /android/i.test(ua)
    ? "Android"
    : /iphone|ipad|ipod/i.test(ua)
      ? "iOS"
      : /windows/i.test(ua)
        ? "Windows"
        : /mac os/i.test(ua)
          ? "macOS"
          : /linux/i.test(ua)
            ? "Linux"
            : "";
  const navigateur = /edg\//i.test(ua)
    ? "Edge"
    : /opr\//i.test(ua)
      ? "Opera"
      : /samsungbrowser/i.test(ua)
        ? "Samsung Internet"
        : /firefox|fxios/i.test(ua)
          ? "Firefox"
          : /chrome|crios/i.test(ua)
            ? "Chrome"
            : /safari/i.test(ua)
              ? "Safari"
              : "Navigateur";
  return [navigateur, systeme].filter(Boolean).join(" · ");
}

const json = (corps: unknown): RequestInit => ({
  headers: { "content-type": "application/json" },
  body: JSON.stringify(corps),
});

/** Dit au serveur à qui appartient l'abonnement de ce navigateur. */
async function rattacher(abonnement: PushSubscription): Promise<boolean> {
  const reponse = await fetch("/api/push/abonnement", {
    method: "POST",
    ...json({ abonnement: abonnement.toJSON(), appareil: nomAppareil() }),
  });
  return reponse.ok;
}

export function NotificationsAppareil() {
  const support = useSyncExternalStore(
    () => () => {},
    lireSupport,
    () => "inconnu" as const,
  );
  const [etat, setEtat] = useState<Etat>("inconnu");
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (support !== "possible") return;
    let annule = false;
    abonnementCourant()
      .then((abonnement) => {
        if (annule) return;
        if (abonnement && Notification.permission === "granted") {
          setEtat("actif");
          // Le navigateur reste rattaché à qui est connecté : un autre
          // compte ouvert ici reprend l'abonnement à son nom.
          void rattacher(abonnement).catch(() => null);
        } else {
          setEtat("inactif");
        }
      })
      .catch(() => {
        if (!annule) setEtat("inactif");
      });
    return () => {
      annule = true;
    };
  }, [support]);

  const activer = async () => {
    setOccupe(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEtat(permission === "denied" ? "refuse" : "inactif");
        return;
      }
      const { cle } = (await (await fetch("/api/push/abonnement")).json()) as {
        cle: string | null;
      };
      if (!cle) {
        setMessage(
          "Les notifications ne sont pas encore configurées sur le serveur.",
        );
        return;
      }
      const inscription = await navigator.serviceWorker.ready;
      const abonnement =
        (await inscription.pushManager.getSubscription()) ??
        (await inscription.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: cleEnOctets(cle),
        }));
      if (!(await rattacher(abonnement))) throw new Error("rattachement");
      setEtat("actif");
      setMessage("C’est fait : cet appareil recevra les notifications.");
    } catch {
      setMessage("L’activation n’a pas abouti. Réessayez dans un instant.");
    } finally {
      setOccupe(false);
    }
  };

  const desactiver = async () => {
    setOccupe(true);
    setMessage(null);
    try {
      const abonnement = await abonnementCourant();
      if (abonnement) {
        await fetch("/api/push/abonnement", {
          method: "DELETE",
          ...json({ endpoint: abonnement.endpoint }),
        });
        await abonnement.unsubscribe();
      }
      setEtat("inactif");
    } catch {
      setMessage("La désactivation n’a pas abouti. Réessayez dans un instant.");
    } finally {
      setOccupe(false);
    }
  };

  const essayer = async () => {
    setOccupe(true);
    setMessage(null);
    try {
      const reponse = await fetch("/api/push/essai", { method: "POST" });
      setMessage(
        reponse.ok
          ? "Notification d’essai envoyée : elle arrive dans quelques secondes."
          : ((await reponse.json()) as { erreur?: string }).erreur ??
              "L’essai n’est pas parti.",
      );
    } catch {
      setMessage("L’essai n’est pas parti. Réessayez dans un instant.");
    } finally {
      setOccupe(false);
    }
  };

  if (support === "inconnu" || support === "absent") return null;

  const lien =
    "cursor-pointer border-0 bg-transparent p-0 text-[12.5px] font-semibold text-accent hover:underline disabled:cursor-default disabled:opacity-50";

  return (
    <div className="border-t border-line px-4 py-3 text-[12.5px] leading-snug">
      {support === "non-securise" ? (
        <p className="m-0 text-muted">
          Les notifications demandent une adresse sécurisée (https) : elles
          seront proposées ici sur la plateforme en ligne.
        </p>
      ) : support === "ios" ? (
        <p className="m-0 flex items-start gap-2 text-muted">
          <Smartphone size={15} className="mt-0.5 shrink-0" aria-hidden />
          Sur iPhone et iPad, installez d’abord l’application (bouton
          « Installer ») pour recevoir les notifications.
        </p>
      ) : support === "refuse" || etat === "refuse" ? (
        <p className="m-0 text-muted">
          Notifications bloquées par le navigateur : autorisez-les dans les
          réglages du site pour les recevoir sur cet appareil.
        </p>
      ) : etat === "actif" ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <span className="inline-flex items-center gap-2 font-semibold text-ink">
            <BellRing size={15} className="text-success" aria-hidden />
            Activées sur cet appareil
          </span>
          <span className="flex gap-4">
            <button
              type="button"
              onClick={essayer}
              disabled={occupe}
              className={lien}
            >
              Essayer
            </button>
            <button
              type="button"
              onClick={desactiver}
              disabled={occupe}
              className={lien}
            >
              Désactiver
            </button>
          </span>
        </div>
      ) : etat === "inactif" ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="text-muted">
            Recevez messages, factures et événements sur cet appareil, même
            l’application fermée.
          </span>
          <button
            type="button"
            onClick={activer}
            disabled={occupe}
            className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border-0 bg-accent px-3 text-[12.5px] font-semibold text-white hover:bg-accent-strong disabled:cursor-default disabled:opacity-60"
          >
            <BellRing size={14} aria-hidden />
            {occupe ? "Activation…" : "Activer"}
          </button>
        </div>
      ) : null}
      {message ? (
        <p role="status" className="m-0 mt-2 text-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
