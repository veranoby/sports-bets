// 🚀 ENHANCED SERVICE WORKER - PWA Optimization Phase 3
const CACHE_NAME = 'gallobets-cache-v2';
const STATIC_CACHE = 'gallobets-static-v2';
const API_CACHE = 'gallobets-api-v2';
const IMAGES_CACHE = 'gallobets-images-v2';

// Comprehensive caching strategy
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // Core app routes for offline access
  '/events',
  '/profile',
  '/subscriptions'
];

// API endpoints to cache for offline viewing
const API_ENDPOINTS_TO_CACHE = [
  '/api/events',
  '/api/venues',
  '/api/user/profile'
];

// Install event: enhanced caching
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing with enhanced caching');
  event.waitUntil(
    Promise.all([
      // Cache core static assets
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(urlsToCache);
      }),
      // Pre-cache critical API data
      caches.open(API_CACHE).then((cache) => {
        return Promise.all(
          API_ENDPOINTS_TO_CACHE.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                cache.put(url, response.clone());
              }
            }).catch(() => {
              console.log(`Failed to pre-cache ${url}`);
            })
          )
        );
      })
    ])
  );
  self.skipWaiting();
});

// Activate event: enhanced cleanup
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating with cache cleanup');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!['gallobets-static-v2', 'gallobets-api-v2', 'gallobets-images-v2'].includes(cacheName)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
  self.clients.claim();
});

// Enhanced fetch event with intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API caching strategy - Network First with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request, API_CACHE)
    );
    return;
  }

  // Images caching - Cache First
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    event.respondWith(
      cacheFirstStrategy(request, IMAGES_CACHE)
    );
    return;
  }

  // Static assets - Cache First with network fallback
  if (url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/i)) {
    event.respondWith(
      cacheFirstStrategy(request, STATIC_CACHE)
    );
    return;
  }

  // HTML/Routes - Network First for fresh content
  event.respondWith(
    networkFirstStrategy(request, STATIC_CACHE)
  );
});

// Network First Strategy - for dynamic content
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log(`Network failed for ${request.url}, trying cache`);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache First Strategy - for static assets  
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log(`Failed to fetch ${request.url}`);
    throw error;
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  if (!event.data) {
    return;
  }

  try {
    const notificationData = event.data.json();
    const { title, body, data } = notificationData;

    const options = {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      data,
      requireInteraction: data?.type === 'pago_proposal',
      actions: []
    };

    // Add action buttons based on notification type
    if (data?.type === 'pago_proposal') {
      options.actions = [
        { action: 'view', title: 'Ver Propuesta', icon: '/icon-96x96.png' },
        { action: 'dismiss', title: 'Ignorar' }
      ];
    } else if (data?.type === 'betting_window_open') {
      options.actions = [
        { action: 'bet', title: 'Apostar', icon: '/icon-96x96.png' }
      ];
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Notification clicked:', event.notification.data);
  
  event.notification.close();
  
  const data = event.notification.data;
  let url = '/';

  // Determine URL based on notification type
  if (data?.url) {
    url = data.url;
  } else if (data?.type === 'betting_window_open' && data?.eventId) {
    url = `/events/${data.eventId}`;
  } else if (data?.type === 'pago_proposal') {
    url = '/profile/bets';
  }

  // Handle action buttons
  if (event.action === 'view' || event.action === 'bet' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Try to focus existing window
          for (const client of clientList) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
  // 'dismiss' action does nothing (notification already closed)
});

// Background sync for offline betting queue
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-betting-sync') {
    event.waitUntil(syncOfflineBets());
  }
});

// Sync offline bets when connection is restored
async function syncOfflineBets() {
  try {
    // Get offline bets from IndexedDB (would need to implement)
    const offlineBets = await getOfflineBets();
    
    for (const bet of offlineBets) {
      try {
        const response = await fetch('/api/bets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bet.token}`
          },
          body: JSON.stringify(bet.data)
        });
        
        if (response.ok) {
          await removeOfflineBet(bet.id);
          console.log('✅ Offline bet synced:', bet.id);
        }
      } catch (error) {
        console.error('Failed to sync bet:', bet.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for offline bet management
async function getOfflineBets() {
  // Would implement IndexedDB integration here
  return [];
}

async function removeOfflineBet(betId) {
  // Would implement IndexedDB removal here
  console.log('Removing offline bet:', betId);
}

console.log('🚀 Enhanced Service Worker loaded successfully');