// frontend/src/services/pushNotificationService.ts
// 📱 PUSH NOTIFICATIONS PARA BETTING EVENTS - PWA Enhancement

interface NotificationPayload {
  type: "betting_window_open" | "betting_window_close" | "fight_result";
  title: string;
  body: string;
  data: {
    eventId?: string;
    fightId?: string;
    betId?: string;
    url?: string;
  };
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  async initialize(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported");
      return false;
    }

    try {
      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();

      return true;
    } catch (error) {
      console.error("Push notification initialization failed:", error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      return null;
    }

    try {
      // VAPID key - in production, this should be from environment
      const vapidPublicKey =
        "BMxJpN8V-XR4M8cCh7pW4_6H9V3z9q8n4L7N2kP1V8L5K2wJ9S3Y4T";

      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to backend
      await this.sendSubscriptionToBackend(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error("Push subscription failed:", error);
      return null;
    }
  }

  async sendSubscriptionToBackend(
    subscription: PushSubscription,
  ): Promise<void> {
    try {
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          subscription,
          userId: JSON.parse(localStorage.getItem("user") || "{}").id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send subscription to backend");
      }
    } catch (error) {
      console.error("Error sending subscription to backend:", error);
    }
  }

  // Show local notification (fallback)
  showLocalNotification(payload: NotificationPayload): void {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    new Notification(payload.title, {
      body: payload.body,
      icon: "/icon-192x192.png",
      badge: "/icon-96x96.png",
      data: payload.data,
    });
  }

  // Integration with betting events
  async notifyBettingWindowOpen(
    eventId: string,
    fightId: string,
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: "betting_window_open",
      title: "🟢 Ventana de Apuestas Abierta",
      body: "Nueva pelea disponible para apostar",
      data: { eventId, fightId, url: `/events/${eventId}` },
    };

    this.showLocalNotification(payload);
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Unsubscribe from notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const result = await this.subscription.unsubscribe();
      this.subscription = null;
      return result;
    } catch (error) {
      console.error("Push unsubscription failed:", error);
      return false;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
