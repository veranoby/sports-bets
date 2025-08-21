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
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Gallera Panel
          </h1>
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
            <FileText className="w-4 h-4" />
            <span>Article Management</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-sm text-gray-600">
            <span>Welcome, </span>
            <span className="font-medium">{user?.email}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleProfile}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Profile Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});

GalleraHeader.displayName = "GalleraHeader";

export default GalleraHeader;