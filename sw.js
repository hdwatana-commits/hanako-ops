const CACHE_NAME = "hanako-room-ops-v24";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./cloud-sync.js",
  "./room-review-generator.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/hanako-avatar.jpg",
  "./icons/nav-home.svg",
  "./icons/nav-products.svg",
  "./icons/nav-room.svg",
  "./icons/nav-coordinate.svg",
  "./icons/nav-generator.svg",
  "./icons/nav-calendar.svg",
  "./icons/nav-connections.svg",
  "./icons/nav-analytics.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (new URL(event.request.url).pathname.endsWith("/config.js")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    }),
  );
});
