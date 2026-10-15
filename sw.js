/* Stock Manager service worker: keeps the app working with no internet.
   The app page itself updates automatically when you upload a new version. Change the version number below only if you change the icons or add new files. */
const V = "stock-manager-v1";
const CORE = ["./", "index.html", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png", "icons/favicon-32.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (r.mode === "navigate") {
    /* Open pages from the network when it answers within 3 seconds (so updates arrive), otherwise from the saved copy. */
    e.respondWith(
      Promise.race([fetch(r), new Promise((_, no) => setTimeout(no, 3000))])
        .then(res => {
          if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put("index.html", cp)); }
          return res;
        })
        .catch(() => caches.match("index.html").then(h => h || caches.match("./")))
    );
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
    return res;
  })));
});
