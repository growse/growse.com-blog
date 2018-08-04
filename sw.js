---
---
const staticCachePrefix = "growse.com-cache-";
const staticCacheName = staticCachePrefix+"v1";

console.log("installing service worker");

const urlsToCache = [
    "/",
    "/comments/js/embed.min.js",
    "/posts.json",
    {% for post in site.posts limit:10 %}
    "{{ post.url }}",
    {% endfor %}
    "{% asset critical.scss @path %}",
    "{% asset main.scss @path %}",
    "{% asset opensans-300 @path %}",
    "{% asset opensans-400 @path %}",
    "{% asset inconsolata-500 @path %}",
    "{% asset andada-400 @path %}"
];

/* Start downloading the cache preempt list on install */
self.addEventListener("install", function(e){
    self.skipWaiting();
    e.waitUntil(
        caches.open(staticCacheName).then(function(cache){
            return cache.addAll(urlsToCache);
        })
    )
});

/* Delete any old caches */
self.addEventListener("activate", function(e){
    e.waitUntil(
        caches.keys().then(function(cacheNames){
            return Promise.all(
                cacheNames.filter(function(cacheName){
                    return cacheName.startsWith(staticCachePrefix)
                        && cacheName !== staticCacheName;
                }).map(function(cacheName){
                    return cache.delete(cacheName);
                })
            );
        })
    )
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request);
        })
    );
});
