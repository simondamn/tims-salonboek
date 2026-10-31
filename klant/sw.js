/* Tims Salonboek – service worker: app werkt ook bij slecht bereik en ververst zichzelf bij updates. */
const VERSIE = 'klant-1.2.0';
const CACHE = 'timsk-' + VERSIE;
const SHELL = ['./', './index.html', './manifest.webmanifest', '../icons/icon-192.png', '../icons/icon-512.png', '../icons/apple-touch-icon.png', '../icons/favicon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('timsk-') && k !== CACHE && k !== 'timsk-extern').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin){
    if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')){
      // Altijd eerst de nieuwste versie proberen; zonder internet de bewaarde versie.
      e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; }).catch(() => caches.match('./index.html')));
    } else {
      e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })));
    }
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.hostname)){
    e.respondWith(caches.open('timsk-extern').then(c => c.match(req).then(m => { const f = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => m); return m || f; })));
  }
  // Alle verkeer naar Google (gegevens) gaat altijd direct, nooit uit de cache.
});
