import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

/**
 * Le service worker de l'application, côté notifications : ce qu'il affiche
 * quand une notification arrive, ce qu'il ouvre au clic, et ce qu'il fait
 * quand le navigateur change l'adresse de l'abonnement.
 *
 * Le fichier est exécuté tel quel dans un bac à sable qui imite le strict
 * nécessaire de l'environnement d'un service worker.
 */

type Ecouteur = (evenement: Record<string, unknown>) => void;

function charger() {
  const ecouteurs = new Map<string, Ecouteur>();
  const showNotification = vi.fn(() => Promise.resolve());
  const subscribe = vi.fn(() =>
    Promise.resolve({
      toJSON: () => ({
        endpoint: "https://push.example/nouveau",
        keys: { p256dh: "p", auth: "a" },
      }),
    }),
  );
  const openWindow = vi.fn(() => Promise.resolve(null));
  const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
  const fenetres: { url: string; focus: () => void; navigate?: () => void }[] =
    [];
  const self = {
    addEventListener: (nom: string, f: Ecouteur) => ecouteurs.set(nom, f),
    registration: { showNotification, pushManager: { subscribe } },
    clients: {
      matchAll: vi.fn(() => Promise.resolve(fenetres)),
      openWindow,
      claim: vi.fn(),
    },
    location: { origin: "https://app.cancham.mg" },
    skipWaiting: vi.fn(),
  };
  const contexte = createContext({
    self,
    caches: {
      open: () => Promise.resolve({ add: () => Promise.resolve() }),
      keys: () => Promise.resolve([]),
      match: () => Promise.resolve(undefined),
    },
    fetch: fetchMock,
    URL,
    Response,
    Promise,
    console,
  });
  runInContext(readFileSync("public/sw.js", "utf8"), contexte);
  return { ecouteurs, showNotification, subscribe, openWindow, fetchMock, fenetres };
}

/** Un événement dont on peut attendre ce que le service worker a lancé. */
function evenement(champs: Record<string, unknown>) {
  let attente: Promise<unknown> = Promise.resolve();
  return {
    ...champs,
    waitUntil: (p: Promise<unknown>) => {
      attente = p;
    },
    fini: () => attente,
  };
}

describe("service worker — notifications", () => {
  it("affiche ce que le serveur envoie, avec la page à ouvrir", async () => {
    const sw = charger();
    const e = evenement({
      data: {
        json: () => ({
          titre: "Message de Ana",
          corps: "Bonjour !",
          url: "/membre/messagerie?t=f1",
          etiquette: "fil-f1",
        }),
      },
    });
    sw.ecouteurs.get("push")!(e);
    await e.fini();
    expect(sw.showNotification).toHaveBeenCalledWith("Message de Ana", {
      body: "Bonjour !",
      icon: "/icones/icone-192.png",
      badge: "/icones/badge-96.png",
      tag: "fil-f1",
      renotify: true,
      data: { url: "/membre/messagerie?t=f1" },
    });
  });

  it("garde un titre et une page par défaut si le contenu manque", async () => {
    const sw = charger();
    const e = evenement({ data: null });
    sw.ecouteurs.get("push")!(e);
    await e.fini();
    expect(sw.showNotification).toHaveBeenCalledWith(
      "CanCham Connect",
      expect.objectContaining({ body: "", data: { url: "/" } }),
    );
  });

  it("au clic, va dans une fenêtre de la plateforme déjà ouverte", async () => {
    const sw = charger();
    const focus = vi.fn();
    const navigate = vi.fn();
    sw.fenetres.push(
      { url: "https://ailleurs.example/page", focus: vi.fn() },
      { url: "https://app.cancham.mg/membre", focus, navigate },
    );
    const close = vi.fn();
    const e = evenement({
      notification: { close, data: { url: "/membre/cotisations/f1" } },
    });
    sw.ecouteurs.get("notificationclick")!(e);
    await e.fini();
    expect(close).toHaveBeenCalled();
    expect(focus).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(
      "https://app.cancham.mg/membre/cotisations/f1",
    );
    expect(sw.openWindow).not.toHaveBeenCalled();
  });

  it("au clic, ouvre une fenêtre s'il n'y en a aucune", async () => {
    const sw = charger();
    const e = evenement({
      notification: { close: vi.fn(), data: { url: "/admin/reglements" } },
    });
    sw.ecouteurs.get("notificationclick")!(e);
    await e.fini();
    expect(sw.openWindow).toHaveBeenCalledWith(
      "https://app.cancham.mg/admin/reglements",
    );
  });

  it("se réabonne avec la même clé quand l'adresse change, et prévient le serveur", async () => {
    const sw = charger();
    const cle = new Uint8Array([1, 2, 3]);
    const e = evenement({
      oldSubscription: { options: { applicationServerKey: cle } },
      newSubscription: null,
    });
    sw.ecouteurs.get("pushsubscriptionchange")!(e);
    await e.fini();
    expect(sw.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: cle,
    });
    const [url, options] = (sw.fetchMock.mock.calls as unknown as [string, RequestInit][])[0];
    expect(url).toBe("/api/push/abonnement");
    expect(options.method).toBe("POST");
    expect(JSON.parse(String(options.body))).toEqual({
      abonnement: {
        endpoint: "https://push.example/nouveau",
        keys: { p256dh: "p", auth: "a" },
      },
    });
  });
});
