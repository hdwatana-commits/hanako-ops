const CACHE_NAME = "hanako-room-ops-v61";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=61",
  "./app.js?v=61",
  "./cloud-sync.js",
  "./room-review-generator.js",
  "./covers/rakuten-room-cover-hanako-v5.jpg",
  "./manifest.webmanifest",
  "./manifest-cafe.webmanifest",
  "./manifest-chic.webmanifest",
  "./manifest-lavender.webmanifest",
  "./manifest-mint.webmanifest",
  "./manifest-navy.webmanifest",
  "./manifest-strawberry.webmanifest",
  "./manifest-perfume.webmanifest",
  "./manifest-closet.webmanifest",
  "./manifest-shopping.webmanifest",
  "./manifest-mirror.webmanifest",
  "./manifest-notebook.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/hanako-avatar.jpg",
  "./icons/hanako-avatar-cafe.png",
  "./icons/hanako-avatar-chic.png",
  "./icons/hanako-avatar-lavender.png",
  "./icons/icon-cafe-192.png",
  "./icons/icon-cafe-512.png",
  "./icons/icon-chic-192.png",
  "./icons/icon-chic-512.png",
  "./icons/icon-lavender-192.png",
  "./icons/icon-lavender-512.png",
  "./icons/hanako-avatar-mint.png",
  "./icons/hanako-avatar-navy.png",
  "./icons/hanako-avatar-strawberry.png",
  "./icons/hanako-avatar-perfume.png",
  "./icons/hanako-avatar-closet.png",
  "./icons/hanako-avatar-shopping.png",
  "./icons/hanako-avatar-mirror.png",
  "./icons/hanako-avatar-notebook.png",
  "./icons/icon-mint-192.png",
  "./icons/icon-mint-512.png",
  "./icons/icon-navy-192.png",
  "./icons/icon-navy-512.png",
  "./icons/icon-strawberry-192.png",
  "./icons/icon-strawberry-512.png",
  "./icons/icon-perfume-192.png",
  "./icons/icon-perfume-512.png",
  "./icons/icon-closet-192.png",
  "./icons/icon-closet-512.png",
  "./icons/icon-shopping-192.png",
  "./icons/icon-shopping-512.png",
  "./icons/icon-mirror-192.png",
  "./icons/icon-mirror-512.png",
  "./icons/icon-notebook-192.png",
  "./icons/icon-notebook-512.png",
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
