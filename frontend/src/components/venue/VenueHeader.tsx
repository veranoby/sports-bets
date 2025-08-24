// frontend/src/components/venue/VenueHeader.tsx
import React, { memo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut, Home } from "lucide-react";

const VenueHeader = memo(() => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-theme-header px-4 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Home className="w-6 h-6 text-orange-500" />
          <h1 className="text-xl font-bold text-theme-primary">Mi Gallera</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-theme-secondary">{user?.username}</span>
          <button 
            onClick={logout} 
            className="flex items-center gap-2 px-3 py-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-accent rounded-lg transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
});

export default VenueHeader;
