// Service Worker for MomentMoi - Refresh Optimization & Offline Support

const CACHE_NAME = "momentmoi-v1";
const STATIC_CACHE = "momentmoi-static-v1";
const API_CACHE = "momentmoi-api-v1";

// Assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/favicon.ico",
  "/fonts/ivy-presto-display-light.otf",
  "/globals.css",
  "/_next/static/css/app/layout.css",
];

// API endpoints to cache (for offline fallback)
const API_ENDPOINTS = ["/api/dashboard", "/api/profile"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing");

  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);

      try {
        // Cache static assets
        await cache.addAll(STATIC_ASSETS);
        console.log("Service Worker: Static assets cached");
      } catch (error) {
        console.error("Service Worker: Failed to cache static assets:", error);
        // Continue without failing the install
      }

      // Force the waiting service worker to become the active service worker
      self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating");

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log("Service Worker: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );

      // Take control of all clients
      self.clients.claim();
      console.log("Service Worker: Activated and claimed all clients");
    })()
  );
});

// Fetch event - serve from cache when possible
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip external requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(request);

          // Cache successful responses
          if (networkResponse.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, networkResponse.clone());
          }

          return networkResponse;
        } catch (error) {
          console.log(
            "Service Worker: Network failed, trying cache for:",
            url.pathname
          );

          // Fallback to cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Return offline fallback for dashboard
          if (url.pathname.includes("/dashboard")) {
            return new Response(
              JSON.stringify({
                message:
                  "You are currently offline. Dashboard data will be available when connection is restored.",
                offline: true,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          throw error;
        }
      })()
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (
    url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/) ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fallback to network
        try {
          const networkResponse = await fetch(request);

          // Cache successful responses
          if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
          }

          return networkResponse;
        } catch (error) {
          console.error(
            "Service Worker: Failed to fetch static asset:",
            url.pathname
          );
          throw error;
        }
      })()
    );
    return;
  }

  // Handle navigation requests (pages) with network-first strategy
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(request);

          // Cache successful responses
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }

          return networkResponse;
        } catch (error) {
          console.log(
            "Service Worker: Network failed, trying cache for navigation"
          );

          // Fallback to cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Return offline page for dashboard
          if (url.pathname === "/dashboard" || url.pathname === "/") {
            const cache = await caches.open(STATIC_CACHE);
            const offlineResponse = await cache.match("/dashboard");

            if (offlineResponse) {
              return offlineResponse;
            }

            // Return basic offline page
            return new Response(
              `
              <!DOCTYPE html>
              <html>
                <head>
                  <title>MomentMoi - Offline</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      text-align: center;
                      padding: 2rem;
                      background: #f9fafb;
                    }
                    .container {
                      max-width: 600px;
                      margin: 0 auto;
                      background: white;
                      padding: 2rem;
                      border-radius: 8px;
                      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    h1 { color: #374151; }
                    p { color: #6b7280; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>You're Offline</h1>
                    <p>Please check your internet connection and try again.</p>
                    <p>Your dashboard will be available once you're back online.</p>
                  </div>
                </body>
              </html>
              `,
              {
                headers: { "Content-Type": "text/html" },
              }
            );
          }

          throw error;
        }
      })()
    );
    return;
  }

  // Default - let the request go through normally
});

// Handle background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle offline actions here
      console.log("Service Worker: Processing offline actions")
    );
  }
});

// Handle push notifications (if needed in the future)
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push received");

  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: data.url,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked");

  event.notification.close();

  if (event.notification.data) {
    event.waitUntil(clients.openWindow(event.notification.data));
  }
});
