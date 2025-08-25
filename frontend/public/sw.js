self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      try {
        return await fetch(event.request);
      } catch (error) {
        console.error("SW fetch error:", error);
        return new Response("Network error", { status: 503 });
      }
    })()
  );
});
