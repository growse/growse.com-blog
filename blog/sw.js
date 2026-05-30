---
layout: null
---
{%- assign css_file = site.static_files | where: "extname", ".css" | where_exp: "f", "f.path contains '/assets/css/'" | first -%}
{%- assign js_files = site.static_files | where: "extname", ".js" | where_exp: "f", "f.path contains '/assets/'" -%}
{%- assign body_font = site.static_files | where: "extname", ".woff2" | where_exp: "f", "f.name contains 'andada'" | first -%}

// The asset filenames carry webpack's content hash, so this changes only when
// the assets actually change, and old caches are dropped on activate.
const VERSION = {{ css_file.name | jsonify }};
const STATIC = `growse-static-${VERSION}`;
const RUNTIME = `growse-runtime-${VERSION}`;

// Enough to render any cached page offline.
const PRECACHE = [
  {{ css_file.path | jsonify }},
{%- for js in js_files %}
  {{ js.path | jsonify }},
{%- endfor %}
  {{ body_font.path | jsonify }},
  "/offline.html",
];

// Pages and images accumulate as you browse; keep that bounded.
const RUNTIME_MAX = 100;

/* Content-hashed URLs never change meaning, so they can be served from cache
   without revalidating. Everything under /assets/img/ is *not* hashed, and
   pagefind.js / the wasm / the entry json keep stable names across rebuilds. */
function isImmutable(pathname) {
  return (
    /^\/assets\/(?!img\/).+\.[0-9a-f]{16,}\.[a-z0-9]+$/.test(pathname) ||
    /^\/pagefind\/.+\.(pf_index|pf_fragment|pf_meta)$/.test(pathname)
  );
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) {
    return;
  }
  // cache.keys() is in insertion order, so this evicts oldest first.
  await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

async function store(request, response) {
  if (!response || !response.ok || response.type === "opaque") {
    return;
  }
  const cache = await caches.open(RUNTIME);
  await cache.put(request, response);
  await trim(RUNTIME, RUNTIME_MAX);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    await store(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

async function staleWhileRevalidate(event, request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then(async (response) => {
      await store(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return (await network) || Response.error();
}

/* Navigations go to the network first so readers always get fresh posts, and
   fall back to whatever we have when the network is gone. */
async function navigate(event) {
  try {
    const preloaded = await event.preloadResponse;
    const response = preloaded || (await fetch(event.request));
    event.waitUntil(store(event.request, response.clone()));
    return response;
  } catch {
    const cached = await caches.match(event.request);
    if (cached) {
      return cached;
    }
    /* ignoreVary matters here: nginx sends "Vary: Accept-Encoding", and a
       Request built from a bare string carries no Accept-Encoding, so the
       default Vary check never matches the precached copy. */
    const shell = await caches.open(STATIC);
    const fallback = await shell.match("/offline.html", { ignoreVary: true });
    return fallback || Response.error();
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Lets a navigation start fetching before the worker has booted.
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC && key !== RUNTIME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return; // let the browser deal with the location endpoint
  }
  if (request.mode === "navigate") {
    event.respondWith(navigate(event));
    return;
  }
  if (isImmutable(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(event, request));
});
