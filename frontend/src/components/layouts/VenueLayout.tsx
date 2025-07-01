// frontend/src/components/layouts/VenueLayout.tsx
import React, { memo } from "react";
import { Outlet } from "react-router-dom";
import VenueHeader from "../venue/VenueHeader";
import VenueNavigation from "../venue/VenueNavigation";
import SubscriptionStatusBar from "../shared/SubscriptionStatusBar";
import PWAInstallPrompt from "../shared/PWAInstallPrompt";

const VenueLayout = memo(() => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <VenueHeader />
      <SubscriptionStatusBar />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <VenueNavigation />

      {/* Prompt de instalación PWA para venues */}
      <PWAInstallPrompt showFor={["venue"]} />
    </div>
  );
});

VenueLayout.displayName = "VenueLayout";

export default VenueLayout;
