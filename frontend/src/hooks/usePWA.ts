// src/hooks/usePWA.ts

import { useState, useEffect } from 'react';
import { pwaService } from '../services/pwaService';

export const usePWA = () => {
  const [canInstall, setCanInstall] = useState(pwaService.canInstall());

  useEffect(() => {
    const handleInstallable = (e: CustomEvent<boolean>) => {
      setCanInstall(e.detail);
    };

    window.addEventListener('pwa-installable', handleInstallable as EventListener);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable as EventListener);
    };
  }, []);

  const install = () => {
    pwaService.triggerInstallPrompt();
  };

  const subscribe = async () => {
    try {
      await pwaService.subscribeToPushNotifications();
      // You might want to update some state here
    } catch (error) {
      console.error('Failed to subscribe to push notifications', error);
    }
  };

  return { canInstall, install, subscribe };
};
