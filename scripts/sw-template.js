// NEST offline support. After the first visit the app opens and runs with no connection.
//
// It does not depend on the build's file layout: at install it reads the pages it is served and the
// scripts and styles those pages point to, and saves what it finds. It only handles same-origin GET
// requests for the app's own files. User data lives in IndexedDB and is never fetched, so it never
// passes through here.
//
// next.config.ts copies this file to public/sw.js with __VERSION__ replaced, so every deploy gets a
// new worker, which replaces the old saved copy.

const VERSION = "__VERSION__";
const CACHE = "nest-" + VERSION;

const ROUTES = ["/", "/home/", "/find/", "/people/", "/outreach/", "/analytics/", "/companies/", "/review/", "/health/", "/settings/", "/session/", "/privacy/"];
const STATIC = ["/icon.png", "/apple-icon.png", "/icon.svg", "/nest-logo.webp", "/owl-mascot.png"];
// The small per-page data file the app requests when you move between screens without a full reload.
const PAGE_DATA = ROUTES.map((r) => r + "index.txt");

// Chunk and media file names as they appear in pages, scripts and styles, with or without Vercel's
// "immutable" folder. The part before "static/" is always /_next/.
const ASSET = /static\/(?:immutable\/)?(?:chunks|media)\/[A-Za-z0-9_.~%-]+\.(?:js|css|woff2?|png|jpe?g|webp|svg|avif)/g;

async function precache() {
  const cache = await caches.open(CACHE);
  const seen = new Set([...ROUTES, ...PAGE_DATA, ...STATIC]);
  const queue = [...seen];

  // An address that does not exist answers with our own 404 page, so offline visitors get it too.
  try {
    const missing = await fetch("/_nest-not-found/", { cache: "reload" });
    await cache.put("/404.html", missing);
  } catch {
    // Not fatal: the browser's own offline page is the fallback.
  }

  while (queue.length) {
    const batch = queue.splice(0, 8);
    await Promise.all(
      batch.map(async (url) => {
        try {
          const res = await fetch(url, { cache: "reload" });
          if (!res.ok) return;
          await cache.put(url, res.clone());
          const type = res.headers.get("content-type") || "";
          if (!/html|javascript|css/.test(type)) return;
          const text = await res.text();
          const found = [];
          for (const m of text.matchAll(ASSET)) found.push("/_next/" + m[0]);
          if (/css/.test(type)) {
            for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
              try {
                const u = new URL(m[1], self.location.origin + url);
                if (u.origin === self.location.origin) found.push(u.pathname);
              } catch {
                // Ignore anything that is not a usable address.
              }
            }
          }
          for (const f of found) {
            if (!seen.has(f)) {
              seen.add(f);
              queue.push(f);
            }
          }
        } catch {
          // One missing file should not stop the rest from being saved.
        }
      }),
    );
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("nest-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname === "/sw.js") return;

  // Pages: ask the network first so a new deploy shows up, and fall back to the saved copy offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("/404.html"))),
    );
    return;
  }

  // Everything else (scripts, styles, fonts, images, page data): the saved copy first. The ?_rsc part
  // of page-data requests changes, so it is ignored when matching.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
