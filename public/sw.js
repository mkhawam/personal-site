// Kill-switch service worker. The site no longer uses a service worker (the old
// cache-first worker served stale pages after every deploy), but browsers that
// installed it keep it registered until a new script replaces it. This one
// installs, wipes the old caches, unregisters itself, and reloads open clients
// so they go back to plain network loads. Safe to delete once every installed
// client has visited at least once (browsers re-check this file within 24h).
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })(),
  );
});
