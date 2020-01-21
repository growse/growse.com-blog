---
---

const staticCachePrefix = "growse.com-cache-";
const staticCacheName = staticCachePrefix + "v1";

const urlsToCache = [
    // "/",
    "/posts.json",
//     {% assign font_files = site.static_files | where: "font", true %}
//     {% for font in font_files %}
//     "{{font.path}}",
//     {% endfor %}
//     {% for post in site.posts limit:10 %}
// "{{ post.url }}",
// {% endfor %}
];

/* Start downloading the cache preempt list on install */
self.addEventListener("install", function (e) {
    self.skipWaiting();
    e.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll(urlsToCache);
        })
    )
});

/* Delete any old caches */
self.addEventListener("activate", function (e) {
    e.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith(staticCachePrefix)
                        && cacheName !== staticCacheName;
                }).map(function (cacheName) {
                    return cache.delete(cacheName);
                })
            );
        })
    )
});

/* Cache, then network, then generic */
self.addEventListener('fetch', function (event) {
    const url = event.request.url;
    event.respondWith(
        // Try the cache
        caches.match(event.request).then(function (response) {
            // Fall back to network
            return response || fetch(event.request);
        }).catch(function (e) {
            if (url.endsWith(".png") || url.endsWith(".jpg")) {
                // If both fail, show a generic fallback:
                return caches.match("/assets/img/png-transparent.png");
            } else {
                console.error(`TOOT! ${url}`);
                console.error(e, e.message);
            }
        })
    );
});
