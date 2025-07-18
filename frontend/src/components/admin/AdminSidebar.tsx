// frontend/src/components/admin/AdminSidebar.tsx
import React, { memo } from "react";
import { useAuth } from "../../contexts/AuthContext";

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

const AdminSidebar = memo(() => {
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/users", icon: Users, label: "Usuarios" },
    { path: "/admin/finance", icon: DollarSign, label: "Finanzas" },
    { path: "/admin/reports", icon: FileText, label: "Reportes" },
  ];

  return (
    <aside className="w-64 bg-gray-800 min-h-screen">
      <div className="p-4">
        <h2 className="text-white text-lg font-bold mb-6">GalloBets Admin</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-lg">
          <LogOut className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </aside>
  );
});

export default AdminSidebar;
