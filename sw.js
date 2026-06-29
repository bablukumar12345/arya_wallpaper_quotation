const CACHE = 'ARYA-WALLPAPER-v1';
const FILES = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/img/logo.jpeg'
];

// Install — sabhi files cache karo
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
  self.skipWaiting();
});

// Activate — purana cache hata do
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — pehle cache se do, nahi toh network se
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});