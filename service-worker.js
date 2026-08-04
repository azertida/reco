/* Reco — service worker
   Stratégie : réseau d'abord, cache en secours.
   Une version corrigée mise en ligne est prise en compte au chargement suivant,
   sans rien avoir à incrémenter ici. Le cache ne sert qu'au mode hors-ligne. */

const CACHE = 'reco';

const RESSOURCES = [
  './',
  './index.html',
  './icon.png',
  './icon-192.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(RESSOURCES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(noms => Promise.all(
        noms.filter(n => n !== CACHE).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const requete = event.request;

  if (requete.method !== 'GET') return;
  if (new URL(requete.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(requete)
      .then(reponse => {
        if (reponse && reponse.ok && reponse.type === 'basic') {
          const copie = reponse.clone();
          caches.open(CACHE).then(cache => cache.put(requete, copie));
        }
        return reponse;
      })
      .catch(async () => {
        const enCache = await caches.match(requete);
        if (enCache) return enCache;
        if (requete.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      })
  );
});
