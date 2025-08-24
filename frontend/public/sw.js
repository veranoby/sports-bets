// sw.js - Service Worker Optimizado
// ================================

const CACHE_NAME = "gallobets-v1.2.0";
const SW_VERSION = "1.2.0";

// Recursos físicos reales para cache
const CORE_CACHE = ["/", "/offline.html"]; // ✅ Eliminado /login

// Recursos estáticos
const STATIC_CACHE = ["/assets/index.css", "/assets/index.js"];

// APIs que NUNCA se cachean
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

// ✅ INSTALACIÓN
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME + "-core")
      .then((cache) => cache.addAll(CORE_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ✅ FETCH - Con filtros mejorados
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ❌ NO interceptar extensiones del navegador
  if (isBrowserExtension(url)) {
    return;
  }

  // 💡 NUEVA REGLA: Ignorar peticiones de desarrollo de Vite y assets locales.
  // Esto previene los errores `net::ERR_FAILED` en la consola que ocurren
  // cuando el Service Worker intercepta incorrectamente las peticiones
  // del cliente de Vite HMR (Hot Module Replacement) o de los módulos fuente.
  if (
    url.hostname === self.location.hostname &&
    (url.pathname.startsWith("/@vite/") ||
      url.pathname.startsWith("/src/") ||
      url.pathname.startsWith("/@react-refresh"))
  ) {
    return; // Dejar que el navegador las maneje directamente, sin interceptar.
  }

  // ❌ NO interceptar WebSocket/APIs críticas
  if (
    NEVER_CACHE.some((path) => url.pathname.includes(path)) ||
    request.headers.get("Upgrade") === "websocket"
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 🏠 Manejar rutas SPA
  if (isSPARoute(url.pathname)) {
    event.respondWith(handleSPANavigation(request));
    return;
  }

  // 🔄 API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // 🎨 Assets estáticos
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // 🌐 Default
  event.respondWith(networkFirstStrategy(request));
});

// ===== FUNCIONES AUXILIARES =====

function isBrowserExtension(url) {
  return ["chrome-extension:", "moz-extension:", "safari-extension:"].some(
    (proto) => url.protocol === proto
  );
}

function shouldNeverCache(request) {
  return NEVER_CACHE.some(
    (path) =>
      request.url.pathname.includes(path) ||
      request.url.href.includes(path) ||
      request.headers.get("upgrade") === "websocket"
  );
}

function isSPARoute(pathname) {
  return (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/dashboard")
  );
}

function isStaticAsset(pathname) {
  return pathname.includes("/assets/") || pathname.includes("/icons/");
}

async function handleSPANavigation(request) {
  try {
    const netResponse = await fetch(request);
    if (netResponse.ok) return netResponse;
  } catch (e) {
    console.log("🌐 SW: Fallback a cache para", request.url);
  }

  const cached = await caches.match("/");
  return cached || caches.match("/offline.html");
}

async function networkFirstStrategy(request) {
  try {
    const netResponse = await fetch(request);

    // ✅ Solo cachear URLs HTTP/HTTPS válidas
    if (
      netResponse.ok &&
      request.url.startsWith("http") &&
      !shouldNeverCache(request)
    ) {
      const cache = await caches.open(CACHE_NAME + "-api");
      cache.put(request, netResponse.clone());
    }

    return netResponse;
  } catch (e) {
    const cached = await caches.match(request);
    return cached || Response.error();
  }
}

async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const netResponse = await fetch(request);

    // ✅ Solo cachear URLs HTTP/HTTPS válidas
    if (request.url.startsWith("http")) {
      const cache = await caches.open(CACHE_NAME + "-static");
      cache.put(request, netResponse.clone());
    }

    return netResponse;
  } catch (e) {
    throw e;
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
