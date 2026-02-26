self.addEventListener('push', function(event) {
  if (event.data) {
    let data = {};
    try {
      data = event.data.json();
    } catch {
      data = { title: event.data.text() };
    }

    const title = data.title || 'New Notification';
    const options = {
      body: data.body || 'You have a new update.',
      icon: '/icon-192x192.png',
      badge: '/badge.png',
      data: data.data || {}
    };

    // Post to all window clients so the foreground app can show a custom Toast
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        let isFocused = false;
        
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          client.postMessage({
            type: 'PUSH_RECEIVED',
            payload: { title, ...options }
          });
          if (client.focused) isFocused = true;
        }
        
        // If no window is focused, show standard system notification
        if (!isFocused) {
          return self.registration.showNotification(title, options);
        }
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // If there's a URL in the payload data, open it
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, just focus it.
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
