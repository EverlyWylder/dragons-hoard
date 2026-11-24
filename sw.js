// Keeps the app working with no internet.
// Online: always fetch the newest files. Offline or very slow: use the saved copy.
// When the app changes, raise the number here AND the ?v= numbers in index.html together.
var CACHE = "dragons-hoard-9";
var FILES = ["./", "index.html", "style.css?v=9", "words.js?v=9", "app.js?v=9", "manifest.json",
  "almendra-bold.ttf", "dragon.webp", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FILES.map(function (f) { return new Request(f, { cache: "reload" }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    function saved() {
      return c.match(req).then(function (hit) {
        // only the page itself may ignore the "?..." part; scripts and styles must match their version exactly
        return hit || (req.mode === "navigate" ? c.match(req, { ignoreSearch: true }) : undefined);
      });
    }
    var net = fetch(req).then(function (res) {
      if (res && res.ok) c.put(req, res.clone());
      return res;
    });
    var slow = new Promise(function (r) { setTimeout(r, 4000); }).then(saved);
    return Promise.race([net.catch(function () { return null; }), slow]).then(function (res) {
      return res || saved().then(function (hit) { return hit || net; });
    });
  }));
});
