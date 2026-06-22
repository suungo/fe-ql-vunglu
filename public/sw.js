self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received.');
  if (event.data) {
    let payload;
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: 'Thông báo mới', body: event.data.text() };
    }

    const title = payload.title || 'Thông báo mới';
    const options = {
      body: payload.body || '',
      icon: '/image-logo.png',
      badge: '/image-logo.png',
      data: payload.data || {},
      vibrate: [100, 50, 100],
    };

    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function (clientList) {
        const isAppFocused = clientList.some(function (client) {
          return client.focused;
        });

        if (isAppFocused) {
          console.log('[Service Worker] App is focused. Skipping browser push notification.');
          return;
        }

        return self.registration.showNotification(title, options);
      })
    );
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
