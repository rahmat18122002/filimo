// Service worker: PWA install + Web Push notifications.
const CACHE_NAME = "kino-park-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Network-first navigation
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/"))
    );
  }
});

// Receive push from server and show notification with sound/vibration
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Filimo", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Filimo";
  const options = {
    body: data.body || "",
    icon: data.poster || "/icon-192.png",
    badge: "/icon-192.png",
    image: data.poster || undefined,
    vibrate: [200, 100, 200],
    tag: data.movie_id || "filimo-notify",
    renotify: true,
    requireInteraction: false,
    data: { movie_id: data.movie_id || null, url: data.movie_id ? `/movie/${data.movie_id}` : "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Open the relevant page when user taps notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) {
          w.navigate(url).catch(() => {});
          return w.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
