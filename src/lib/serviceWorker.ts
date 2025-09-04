// Service Worker Registration Utility

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully:', registration.scope);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, show update prompt
                console.log('New service worker available, consider refreshing');
                // You could dispatch a custom event here to show a toast notification
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Message from service worker:', event.data);

          if (event.data?.type === 'UPDATE_AVAILABLE') {
            window.dispatchEvent(new CustomEvent('sw-update-available'));
          }
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    });
  } else {
    console.warn('Service Worker not supported in this browser');
  }
}

export function unregisterServiceWorker() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then(() => {
          console.log('Service Worker unregistered');
        });
      }
    });
  }
}

// Check if app is running from cache (for offline detection)
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Listen for online/offline events
export function setupNetworkListeners() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    console.log('Network: Online');
    window.dispatchEvent(new CustomEvent('network-online'));
  });

  window.addEventListener('offline', () => {
    console.log('Network: Offline');
    window.dispatchEvent(new CustomEvent('network-offline'));
  });
}
