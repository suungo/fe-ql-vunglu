self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received.');
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || 'Thông báo mới';
      const options = {
        body: data.body || '',
        icon: '/image-logo.png',
        badge: '/image-logo.png',
        data: data.data || {},
        vibrate: [100, 50, 100],
      };
      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('Thông báo mới', {
          body: text,
          icon: '/image-logo.png',
          badge: '/image-logo.png',
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Nếu có tab ứng dụng đang mở, chuyển sang tab đó và focus
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Nếu không, mở một tab mới
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
