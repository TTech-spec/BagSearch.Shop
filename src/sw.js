import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
  const payload = event.data?.json() ?? {};
  const title = payload.title || 'BagSearch';
  const options = {
    body: payload.body || 'You have a new notification.',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    data: {
      url: payload.url || '/seller-profile',
      notificationId: payload.notificationId || null,
    },
    tag: payload.tag || payload.notificationId || 'bagsearch-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destination = event.notification.data?.url || '/seller-profile';

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    for (const client of windowClients) {
      client.postMessage({ type: 'PUSH_NOTIFICATION_CLICKED', url: destination });
      await client.focus();
      if ('navigate' in client) {
        await client.navigate(destination);
      }
      return;
    }

    await self.clients.openWindow(destination);
  })());
});
