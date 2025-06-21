// frontend/src/components/admin/AdminHeader.tsx
import React, { memo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut, Bell } from "lucide-react";

const AdminHeader = memo(() => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Panel de Administración
        </h1>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-600">{user?.username}</span>
          <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
});

export default AdminHeader;
