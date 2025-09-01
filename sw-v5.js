self.addEventListener('install',e=>{
  e.waitUntil(caches.open('lc-v5-3donly').then(c=>c.addAll([
    './index.html','./styles.css','./app3d.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'
  ])));
});self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));