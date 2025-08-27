// frontend/src/components/admin/AdminHeader.tsx
import React, { memo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut, Bell } from "lucide-react";

const AdminHeader = memo(() => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-theme-header px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-theme-primary">
          Panel de Administración
        </h1>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-theme-accent rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-theme-secondary" />
          </button>
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

export default AdminHeader;
