import React, { memo } from "react";
import { Outlet } from "react-router-dom";
import GalleraHeader from "../gallera/GalleraHeader";
import GalleraNavigation from "../gallera/GalleraNavigation";
import SubscriptionStatusBar from "../shared/SubscriptionStatusBar";
import PWAInstallPrompt from "../shared/PWAInstallPrompt";

const GalleraLayout = memo(() => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GalleraHeader />
      <SubscriptionStatusBar />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <GalleraNavigation />

      {/* PWA Install Prompt for gallera users */}
      <PWAInstallPrompt showFor={["gallera"]} />
    </div>
  );
});

GalleraLayout.displayName = "GalleraLayout";

export default GalleraLayout;