// frontend/src/components/layouts/VenueLayout.tsx
import React, { memo } from "react";
import { Outlet } from "react-router-dom";
import VenueHeader from "../venue/VenueHeader";
import VenueNavigation from "../venue/VenueNavigation";

const VenueLayout = memo(() => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <VenueHeader />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <VenueNavigation />
    </div>
  );
});

VenueLayout.displayName = "VenueLayout";

export default VenueLayout;
