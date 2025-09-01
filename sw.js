self.addEventListener('install',e=>{
  e.waitUntil(caches.open('lc-v4').then(c=>c.addAll([
    './index.html','./materials.html','./add.html','./planner.html','./stats.html','./cargo3d.html',
    './styles.css','./common.js','./materials.js','./add.js','./planner.js','./stats.js','./cargo3d.js',
    './manifest.webmanifest','./icon-192.png','./icon-512.png'
  ])));
});self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));