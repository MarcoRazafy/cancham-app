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
