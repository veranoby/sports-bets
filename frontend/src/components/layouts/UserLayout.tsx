// frontend/src/components/layouts/UserLayout.tsx
// Layout wrapper que mantiene UserHeader entre navegaciones

import React, { memo } from "react";
import { Outlet } from "react-router-dom";
import UserHeader from "../user/UserHeader";
import Navigation from "../user/Navigation";
import SubscriptionStatusBar from "../shared/SubscriptionStatusBar";

const UserLayout = memo(() => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header persistente - NO se desmonta entre navegaciones */}
      <UserHeader />

      {/* Barra de estado de suscripción (solo visible si hay suscripción activa) */}
      <SubscriptionStatusBar />

      {/* Contenido de la página actual */}
      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      {/* Navigation persistente en la parte inferior */}
      <Navigation />
    </div>
  );
});

UserLayout.displayName = "UserLayout";

export default UserLayout;
