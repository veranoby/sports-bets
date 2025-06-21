// frontend/src/components/venue/VenueHeader.tsx
import React, { memo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut, Home } from "lucide-react";

const VenueHeader = memo(() => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Home className="w-6 h-6 text-orange-500" />
          <h1 className="text-xl font-bold text-gray-900">Mi Gallera</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.username}</span>
          <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
});

export default VenueHeader;
