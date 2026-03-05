self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
});

self.addEventListener('push', function (event) {
  if (event.data) {
    let data = { title: 'Notification', body: 'New alert!', data: null };
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }

    const options = {
      body: data.body,
      icon: '/icon.png', // Fallback, would need actual icon
      badge: '/badge.png',
      data: data.data,
      vibrate: [100, 50, 100],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Subscription Tracker', options)
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: "window"
    }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});
