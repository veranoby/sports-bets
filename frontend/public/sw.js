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
            if (!['gallobets-cache-v2', 'gallobets-static-v2', 'gallobets-api-v2', 'gallobets-images-v2'].includes(cacheName)) {
              console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
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
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // If everything fails, show an offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
  );
});