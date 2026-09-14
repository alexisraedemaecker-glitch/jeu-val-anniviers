// Mise en cache de l'enveloppe de l'application.
//
// Strategie volontairement prudente pour un evenement d'une journee :
//   - fichiers de l'application : le reseau d'abord, avec un delai court, puis
//     le cache. On est donc toujours a jour quand il y a du reseau, et l'app
//     s'ouvre quand meme quand il n'y en a pas.
//   - photos du stockage Supabase : le cache d'abord, elles ne changent jamais.
//   - appels a la base : jamais de cache, les scores doivent etre justes.

const CACHE = "anniviers2056-v11";
const NET_TIMEOUT = 4000;

const SHELL = [
  "./",
  "index.html",
  "app.css",
  "manifest.webmanifest",
  "js/app.js",
  "js/config.js",
  "js/store.js",
  "js/queue.js",
  "js/image.js",
  "js/data/pillars.js",
  "js/data/challenges.js",
  "js/data/synergies.js",
  "js/ui/bits.js",
  "js/ui/onboarding.js",
  "js/ui/challenges.js",
  "js/ui/challenge.js",
  "js/ui/progress.js",
  "js/ui/ranking.js",
  "js/ui/gallery.js",
  "js/ui/me.js",
  "js/ui/organizer.js",
  "js/ui/activites.js",
  "js/ui/fil.js",
  "js/data/activites.js",
  "js/data/randos-stats.js",
  "js/data/vallee.js",
  "assets/vallee/vallee-00.jpg",
  "assets/vallee/vallee-20.jpg",
  "assets/vallee/vallee-40.jpg",
  "assets/vallee/vallee-60.jpg",
  "assets/vallee/vallee-80.jpg",
  "assets/vallee/vallee-100.jpg",
  "assets/vallee/vallee-00-small.jpg",
  "assets/vallee/vallee-20-small.jpg",
  "assets/vallee/vallee-40-small.jpg",
  "assets/vallee/vallee-60-small.jpg",
  "assets/vallee/vallee-80-small.jpg",
  "assets/vallee/vallee-100-small.jpg",
  "js/vendor/htm-preact.js",
  "js/vendor/supabase.js",
  "assets/icones/corne-48.png",
  "assets/icones/corne-96.png",
  "assets/icones/marmotte-48.png",
  "assets/icones/marmotte-96.png",
  "assets/icon-180.png",
  "assets/icon-192.png",
  "assets/icon-maskable-192.png",
  "assets/favicon-32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        // addAll echoue en entier si un seul fichier manque : on y va un par un.
        Promise.all(SHELL.map((url) => cache.add(new Request(url, { cache: "reload" })).catch(() => null)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function fromNetworkFirst(request) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (resp) => {
      if (!settled) {
        settled = true;
        resolve(resp);
      }
    };

    const timer = setTimeout(() => {
      caches.match(request).then((hit) => {
        if (hit) done(hit);
      });
    }, NET_TIMEOUT);

    // no-cache force une revalidation aupres du serveur. Sans cela, le cache
    // HTTP de GitHub Pages, regle sur dix minutes, pourrait servir une version
    // ancienne alors qu'une correction vient d'etre publiee. La revalidation
    // repond 304 et ne coute presque rien quand rien n'a change.
    fetch(new Request(request.url, { cache: "no-cache", credentials: "omit" }))
      .then((resp) => {
        clearTimeout(timer);
        if (resp && resp.ok && resp.type !== "opaque") {
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy).catch(() => null));
        }
        done(resp);
      })
      .catch(() => {
        clearTimeout(timer);
        caches.match(request).then((hit) => {
          done(
            hit ||
              new Response("Hors ligne et cette page n'est pas en cache.", {
                status: 503,
                headers: { "Content-Type": "text/plain; charset=utf-8" }
              })
          );
        });
      });
  });
}

function fromCacheFirst(request) {
  return caches.match(request).then((hit) => {
    if (hit) return hit;
    return fetch(request).then((resp) => {
      if (resp && resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy).catch(() => null));
      }
      return resp;
    });
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch (err) {
    return;
  }

  // Photos du stockage Supabase : immuables, donc le cache d'abord.
  if (url.pathname.includes("/storage/v1/object/public/")) {
    event.respondWith(fromCacheFirst(req));
    return;
  }

  // Tout le reste de Supabase (base, temps reel, depots) passe directement.
  if (url.hostname.endsWith(".supabase.co")) return;

  // Profils, tracés et fichiers GPX : immuables, donc le cache d'abord, et
  // mis en cache au fil des consultations plutôt qu'à l'installation.
  if (
    url.origin === self.location.origin &&
    (url.pathname.includes("/assets/randos/") || url.pathname.includes("/assets/photos/") || url.pathname.includes("/assets/vallee/"))
  ) {
    event.respondWith(fromCacheFirst(req));
    return;
  }

  // Fichiers de l'application.
  if (url.origin === self.location.origin) {
    event.respondWith(fromNetworkFirst(req));
  }
});
