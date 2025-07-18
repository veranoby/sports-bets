// frontend/src/components/admin/AdminSidebar.tsx
import React, { memo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Server,
  LogOut,
} from "lucide-react";

const AdminSidebar = memo(() => {
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/users", icon: Users, label: "Usuarios Regulares" },
    { path: "/admin/venues", icon: Building2, label: "Usuarios Venues" },
    { path: "/admin/operators", icon: Settings, label: "Usuarios Operadores" },
    { path: "/admin/articles", icon: FileText, label: "Noticias" },
    { path: "/admin/events", icon: Calendar, label: "Eventos ⭐" },
    { path: "/admin/requests", icon: DollarSign, label: "Solicitudes" },
    { path: "/admin/finance", icon: TrendingUp, label: "Finanzas" },
    { path: "/admin/monitoring", icon: Server, label: "Monitoreo" },
  ];

  return (
    <aside className="w-64 bg-gray-800 min-h-screen flex flex-col">
      <div className="p-4 flex-1">
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
                    ? "bg-gray-700 text-white font-medium"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
});

export default AdminSidebar;
