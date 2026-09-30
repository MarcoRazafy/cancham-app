/*
 * Service worker de l'application CanCham.
 *
 * Volontairement minimal : il ne met rien en cache de ce que la plateforme
 * affiche — les pages d'un espace membre changent sans cesse et doivent
 * toujours venir du serveur. Il ne garde qu'une page, « Hors ligne », qu'il
 * montre quand une navigation échoue faute de réseau : sans lui,
 * l'application installée afficherait l'écran d'erreur du navigateur.
 */
const CACHE = "cancham-hors-ligne-v1";
const HORS_LIGNE = "/hors-ligne.html";

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(HORS_LIGNE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evenement) => {
  // Les caches d'une version précédente partent : il n'en reste qu'un.
  evenement.waitUntil(
    caches
      .keys()
      .then((noms) =>
        Promise.all(
          noms.filter((n) => n !== CACHE).map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evenement) => {
  // Seules les navigations — l'ouverture d'une page — sont concernées ;
  // les données, images et scripts suivent leur chemin habituel.
  if (evenement.request.mode !== "navigate") return;
  evenement.respondWith(
    fetch(evenement.request).catch(() =>
      caches.match(HORS_LIGNE).then((page) => page ?? Response.error()),
    ),
  );
});

/* ---------- Notifications de l'appareil ---------- */

/*
 * Le serveur envoie un petit JSON : titre, corps, page à ouvrir, étiquette.
 * L'étiquette regroupe : une nouvelle notification d'un même fil remplace la
 * précédente au lieu de s'empiler.
 */
self.addEventListener("push", (evenement) => {
  let n = {};
  try {
    n = evenement.data ? evenement.data.json() : {};
  } catch {
    n = { corps: evenement.data ? evenement.data.text() : "" };
  }
  evenement.waitUntil(
    self.registration.showNotification(n.titre || "CanCham Connect", {
      body: n.corps || "",
      icon: "/icones/icone-192.png",
      badge: "/icones/badge-96.png",
      tag: n.etiquette || undefined,
      renotify: Boolean(n.etiquette),
      data: { url: n.url || "/" },
    }),
  );
});

/*
 * Au clic, la page qui traite la notification : dans une fenêtre de la
 * plateforme déjà ouverte s'il y en a une, sinon dans une nouvelle.
 */
self.addEventListener("notificationclick", (evenement) => {
  evenement.notification.close();
  const url = new URL(
    (evenement.notification.data && evenement.notification.data.url) || "/",
    self.location.origin,
  ).href;
  evenement.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (fenetres) => {
        const ouverte = fenetres.find(
          (f) => new URL(f.url).origin === self.location.origin,
        );
        if (ouverte) {
          await ouverte.focus();
          return "navigate" in ouverte ? ouverte.navigate(url) : undefined;
        }
        return self.clients.openWindow(url);
      }),
  );
});

/*
 * Le navigateur a changé l'adresse de l'abonnement : on se réinscrit avec la
 * même clé et on prévient le serveur, sinon les envois partiraient dans le
 * vide.
 */
self.addEventListener("pushsubscriptionchange", (evenement) => {
  const ancien = evenement.oldSubscription;
  const nouveau = evenement.newSubscription
    ? Promise.resolve(evenement.newSubscription)
    : self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: ancien && ancien.options.applicationServerKey,
      });
  evenement.waitUntil(
    nouveau.then((abonnement) =>
      fetch("/api/push/abonnement", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ abonnement: abonnement.toJSON() }),
      }),
    ),
  );
});
