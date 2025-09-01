// sw-v6: pulizia cache e auto-unregister
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    // unregister e ricarica tutti i client per prendere la versione nuova
    await self.registration.unregister();
    const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
    clientsList.forEach(c => c.navigate(c.url));
  })());
});
self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));
