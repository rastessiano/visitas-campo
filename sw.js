/* Service worker: guarda la app en el teléfono para que abra sin señal. */
var VERSION = 'visitas-sj-2026-11-09-v12';
var APP = ['./', 'index.html', 'estilos.css', 'app.js', 'reglas.js', 'gastos.js', 'asistente-local.js', 'asistente.js', 'inicio.js', 'manifest.webmanifest',
  'icono-192.png', 'icono-512.png', 'logo-barra.png', 'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css',
  'vendor/leaflet/images/layers.png', 'vendor/leaflet/images/marker-icon.png', 'vendor/leaflet/images/marker-shadow.png'];
var TESELAS = 'teselas-sj';
var FUENTES = 'fuentes-sj';

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(APP); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION && k !== TESELAS && k !== FUENTES; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // El servidor (Apps Script) siempre va por la red.
  if (/script\.google(usercontent)?\.com$/.test(url.hostname)) return;
  // Imagen satelital: se guarda la primera vez que se ve, para tenerla sin señal.
  if (url.hostname === 'server.arcgisonline.com') {
    e.respondWith(caches.open(TESELAS).then(function (c) {
      return c.match(e.request).then(function (r) {
        return r || fetch(e.request).then(function (resp) { if (resp.ok) c.put(e.request, resp.clone()); return resp; });
      });
    }).catch(function () { return new Response('', { status: 504 }); }));
    return;
  }
  // Tipografía de Pastos (Google Fonts): se guarda la primera vez, para tenerla sin señal.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FUENTES).then(function (c) {
      return c.match(e.request).then(function (r) {
        return r || fetch(e.request).then(function (resp) { if (resp.ok || resp.type === 'opaque') c.put(e.request, resp.clone()); return resp; });
      });
    }).catch(function () { return new Response('', { status: 504 }); }));
    return;
  }
  if (url.origin !== location.origin) return;
  // App: con conexión, primero la versión publicada (así se ven los cambios enseguida);
  // si la red no contesta en 4 segundos o no hay señal, la copia guardada.
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(e.request, { ignoreSearch: true }).then(function (guardada) {
      var red = fetch(e.request, { cache: 'no-cache' }).then(function (resp) {
        if (resp.ok) c.put(e.request, resp.clone());
        return resp;
      });
      if (!guardada) return red;
      var espera = new Promise(function (ok) { setTimeout(function () { ok(guardada); }, 4000); });
      return Promise.race([red.catch(function () { return guardada; }), espera]);
    });
  }));
});
