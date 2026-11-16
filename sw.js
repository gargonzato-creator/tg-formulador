const CACHE = "formulador-tg-v4";
const ASSETS = ["./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isHtmlNavigation(request) {
  if (request.mode === "navigate") return true;
  try {
    var url = new URL(request.url);
    var path = url.pathname;
    return path === "/" || path === "/index.html" || /\/index\.html$/.test(path);
  } catch (e) {
    return false;
  }
}

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  if (isHtmlNavigation(event.request)) {
    event.respondWith(
      fetch(event.request).then(function (resp) {
        if (resp && resp.ok) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put("./index.html", copy);
          });
        }
        return resp;
      }).catch(function () {
        return caches.match("./index.html");
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (resp) {
        return resp;
      }).catch(function () {
        if (event.request.mode === "navigate") return caches.match("./index.html");
        return undefined;
      });
    })
  );
});
