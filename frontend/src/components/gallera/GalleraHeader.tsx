import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Settings, FileText } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const GalleraHeader = memo(() => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/gallera/profile");
  };

  return (
    <header className="bg-theme-header px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-theme-primary">
            Gallera Panel
          </h1>
          <div className="hidden sm:flex items-center space-x-2 text-sm text-theme-secondary">
            <FileText className="w-4 h-4" />
            <span>Article Management</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-sm text-theme-secondary">
            <span>Welcome, </span>
            <span className="font-medium">{user?.email}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleProfile}
              className="p-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-accent rounded-lg transition-colors"
              title="Profile Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-accent rounded-lg transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});

GalleraHeader.displayName = "GalleraHeader";

export default GalleraHeader;