// sw.js - Service Worker para GalloBets PWA (SPA Optimizado)
// ========================================================

const CACHE_NAME = "gallobets-v1.2.0";
const SW_VERSION = "1.2.0";

// Recursos físicos reales para cache (solo archivos existentes)
const CORE_CACHE = ["/", "/offline.html"];

// Recursos estáticos
const STATIC_CACHE = ["/assets/index.css", "/assets/index.js"];

// Rutas de la SPA (manejadas por React Router)
const SPA_ROUTES = [
  "/dashboard",
  "/events",
  "/wallet",
  "/bets",
  "/profile",
  "/venue",
  "/admin",
  "/operator",
  "/login",
];

// APIs que NUNCA se cachean (críticas financieramente + WebSocket)
const NEVER_CACHE = [
  "/api/wallet/",
  "/api/bets/",
  "/api/transactions/",
  "/api/auth/login",
  "/api/auth/register",
  "/socket.io/",
  "/api/ws/",
  "ws://",
  "wss://",
];

// ✅ INSTALACIÓN - Cache inicial
self.addEventListener("install", (event) => {
  console.log("📦 SW: Instalando versión", SW_VERSION);

  event.waitUntil(
    Promise.all([
      // Cache core - solo archivos físicos
      caches.open(CACHE_NAME + "-core").then((cache) => {
        return cache.addAll(CORE_CACHE);
      }),

      // Cache estáticos - assets del build
      caches.open(CACHE_NAME + "-static").then((cache) => {
        return cache.addAll(STATIC_CACHE);
      }),
    ]).then(() => {
      console.log("✅ SW: Cache inicial completado");
      self.skipWaiting(); // Activar inmediatamente
    })
  );
});

// ✅ ACTIVACIÓN - Limpiar caches antiguos
self.addEventListener("activate", (event) => {
  console.log("🔄 SW: Activando versión", SW_VERSION);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar caches de versiones anteriores
            if (
              cacheName.startsWith("gallobets-") &&
              !cacheName.includes("v1.2.0")
            ) {
              console.log("🗑️ SW: Eliminando cache antiguo", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("✅ SW: Activación completada");
        return self.clients.claim(); // Controlar todas las pestañas
      })
  );
});

// ✅ FETCH - Estrategia de cache inteligente para SPA
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ❌ NUNCA interceptar WebSocket o APIs críticas
  if (
    NEVER_CACHE.some(
      (path) => url.pathname.includes(path) || url.href.includes(path)
    )
  ) {
    return;
  }

  // ❌ NO interceptar WebSocket connections
  if (event.request.headers.get("upgrade") === "websocket") {
    return;
  }

  // 🔄 API calls - Network First (datos en tiempo real)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // 🏠 SPA Navigation - Servir index.html para rutas de la aplicación
  if (isSPARoute(url.pathname)) {
    event.respondWith(handleSPANavigation(event.request));
    return;
  }

  // 🎨 Assets estáticos - Cache First
  if (url.pathname.includes("/assets/") || url.pathname.includes("/icons/")) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }

  // 🌐 Default - Network First con fallback
  event.respondWith(networkFirstStrategy(event.request));
});

// Función para detectar rutas SPA
function isSPARoute(pathname) {
  return (
    SPA_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname === "/" ||
    pathname === "/login"
  );
}

// Estrategia para manejar navegación SPA
async function handleSPANavigation(request) {
  try {
    // Intentar red desde la red primero
    const networkResponse = await fetch(request);
    if (networkResponse.ok) return networkResponse;
  } catch (error) {
    console.log("🌐 SW: Fallback a cache para SPA route", request.url);
  }

  // Fallback: servir index.html desde cache
  const cachedResponse = await caches.match("/");
  if (cachedResponse) {
    return cachedResponse;
  }

  // Último recurso: offline.html
  return caches.match("/offline.html");
}

// ESTRATEGIA: Network First para APIs
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok && !request.url.includes("/api/wallet/")) {
      const cache = await caches.open(CACHE_NAME + "-api");
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.url.includes("/api/events")) {
      return new Response(
        JSON.stringify({
          data: [],
          message: "Sin conexión - eventos no disponibles",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    throw error;
  }
}

// ESTRATEGIA: Cache First para assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME + "-static");
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.log("❌ SW: Error cargando asset", request.url);
    throw error;
  }
}

// ✅ PUSH NOTIFICATIONS - Para resultados de apuestas
self.addEventListener("push", (event) => {
  console.log("🔔 SW: Push notification recibida");

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.message || "Nueva notificación de GalloBets",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    image: data.image || null,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/dashboard",
      timestamp: Date.now(),
    },
    actions: [
      {
        action: "view",
        title: "Ver",
        icon: "/icons/action-view.png",
      },
      {
        action: "dismiss",
        title: "Cerrar",
        icon: "/icons/action-close.png",
      },
    ],
    requireInteraction: data.priority === "high",
    silent: data.priority === "low",
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "GalloBets", options)
  );
});

// ✅ NOTIFICATION CLICK - Manejar clicks en notificaciones
self.addEventListener("notificationclick", (event) => {
  console.log("👆 SW: Click en notificación", event.action);

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }

        // Si no, abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ✅ BACKGROUND SYNC - DESHABILITADO para apuestas críticas
self.addEventListener("sync", (event) => {
  // ❌ NO sync automático de apuestas - muy peligroso para P2P
  console.log(
    "🔄 SW: Background sync no implementado por seguridad financiera"
  );

  // Solo sync de datos no críticos como notificaciones leídas
  if (event.tag === "notifications-sync") {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  console.log("🔄 SW: Sincronizando notificaciones no críticas");
  // Solo sync de datos que no afectan apuestas/dinero
}

// ✅ ERROR HANDLER
self.addEventListener("error", (event) => {
  console.error("❌ SW: Error global", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("❌ SW: Promise rechazada", event.reason);
});

console.log("🚀 SW: Service Worker GalloBets cargado v" + SW_VERSION);
