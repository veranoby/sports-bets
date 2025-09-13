// frontend/src/components/layouts/UserLayout.tsx
// Layout wrapper que mantiene UserHeader entre navegaciones

import { memo } from "react";
import { Outlet } from "react-router-dom";
import UserHeader from "../user/UserHeader";
import Navigation from "../user/Navigation";
import SubscriptionStatusBar from "../shared/SubscriptionStatusBar";
import PWAInstallPrompt from "../shared/PWAInstallPrompt";
//import AdSpace from "../ads/AdSpace";
import Breadcrumbs from "../shared/Breadcrumbs";

const UserLayout = memo(() => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header persistente - NO se desmonta entre navegaciones */}
      <UserHeader />

      {/* Barra de estado de suscripción (solo visible si hay suscripción activa) */}
      <SubscriptionStatusBar />

      {/* Header Ad Space 
      <AdSpace location="header" size="banner" className="mx-4" />
      */}

      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Contenido de la página actual */}
      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      {/* Navigation persistente en la parte inferior */}
      <Navigation />

      {/* Prompt de instalación PWA para usuarios */}
      <PWAInstallPrompt showFor={["user"]} />
    </div>
  );
});

UserLayout.displayName = "UserLayout";

export default UserLayout;
