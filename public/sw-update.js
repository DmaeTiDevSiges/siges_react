// Simple service worker helper for update flow
self.addEventListener('install', (event) => {
  // skip waiting is triggered by client message
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  const { type } = event.data;
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      await self.clients.claim();
      const allClients = await self.clients.matchAll({ includeUncontrolled: true });
      for (const client of allClients) {
        client.postMessage({ type: 'SW_ACTIVATED' });
      }
    } catch (e) {
      // ignore
    }
  })());
});
