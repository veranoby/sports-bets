// frontend/src/components/shared/PWAInstallPrompt.tsx
// Component para prompt de instalación PWA - USER y VENUE solamente

import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  showFor?: ('user' | 'venue')[];
  delay?: number;
  autoShow?: boolean;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  showFor = ['user', 'venue'],
  delay = 3000,
  autoShow = true
}) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Verificar si ya está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone;
    setIsInstalled(isStandalone);

    // Handler para beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Solo mostrar para roles específicos y en móvil
      const isMobile = window.innerWidth <= 768;
      const userRole = user?.role;
      const shouldShow = userRole && showFor.includes(userRole as 'user' | 'venue') && isMobile && !isStandalone && autoShow;
      
      if (shouldShow) {
        setTimeout(() => setIsVisible(true), delay);
      }
    };

    // Handler para app instalada
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [user?.role, showFor, delay, autoShow]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      // Analytics tracking
      if ((window as any).gtag) {
        (window as any).gtag('event', 'pwa_install_' + outcome, {
          user_role: user?.role
        });
      }
      
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    
    // Analytics tracking
    if ((window as any).gtag) {
      (window as any).gtag('event', 'pwa_install_dismissed', {
        user_role: user?.role
      });
    }
    
    // No mostrar again por 24h
    localStorage.setItem('pwa_dismissed', Date.now().toString());
  };

  // No mostrar si está instalado o no es móvil
  if (isInstalled || window.innerWidth > 768) return null;

  // No mostrar si fue rechazado recientemente
  const dismissed = localStorage.getItem('pwa_dismissed');
  if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) {
    return null;
  }

  // iOS Safari prompt específico
  if (isIOS && isVisible) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border p-4 z-50 animate-slide-up">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Instalar Galleros<span className="text-red-500">.Net</span>
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Para instalar esta app en tu iPhone:
            </p>
            <ol className="text-xs text-gray-500 space-y-1">
              <li>1. Toca el botón de compartir en Safari</li>
              <li>2. Selecciona "Añadir a inicio"</li>
              <li>3. Toca "Añadir"</li>
            </ol>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Android/Chrome prompt
  if (isVisible && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border p-4 z-50 animate-slide-up">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Instalar Galleros<span className="text-red-500">.Net</span></h3>
            <p className="text-sm text-gray-600">
              Acceso rápido desde tu pantalla de inicio
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium"
            >
              Instalar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Hook personalizado para control manual de PWA
export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone;
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setCanInstall(false);
      return outcome;
    }
    return null;
  };

  return {
    canInstall,
    isInstalled,
    install
  };
};

// PWA Install Button Component
export const PWAInstallButton: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className = '', children }) => {
  const { canInstall, install } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <button
      onClick={install}
      className={`flex items-center space-x-2 ${className}`}
    >
      <Download className="w-4 h-4" />
      <span>{children || 'Instalar App'}</span>
    </button>
  );
};

export default PWAInstallPrompt;