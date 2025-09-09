// frontend/src/components/admin/AdminSidebar.tsx
import React, { memo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Server,
  Settings,
  LogOut,
} from "lucide-react";

const AdminSidebar = memo(() => {
  const { user, logout } = useAuth();

  const allNavItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "operator"] },
    { path: "/admin/users", icon: Users, label: "Usuarios", roles: ["admin", "operator"] },
    { path: "/admin/venues", icon: Building2, label: "Galleras", roles: ["admin", "operator"] },
    { path: "/admin/articles", icon: FileText, label: "Noticias", roles: ["admin", "operator"] },
    { path: "/admin/events", icon: Calendar, label: "Eventos ⭐", roles: ["admin", "operator"] },
    { path: "/admin/requests", icon: DollarSign, label: "Solicitudes", roles: ["admin"] },
    { path: "/admin/finance", icon: TrendingUp, label: "Finanzas", roles: ["admin"] },
    { path: "/admin/monitoring", icon: Server, label: "Monitoreo", roles: ["admin", "operator"] },
    { path: "/admin/settings", icon: Settings, label: "Configuración", roles: ["admin"] },
  ];

  const navItems = (() => {
    if (!user?.role) return [];
    
    // Filter items based on role permissions
    return allNavItems.filter(item => item.roles.includes(user.role));
  })();

  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Invitado';

  return (
    <aside className="w-64 bg-gray-300 min-h-screen flex flex-col">
      <div className="p-4 flex-1">
        <h2 className="text-gray-600 text-lg font-bold mb-2">GalloBets Admin</h2>
        <div className={`mb-6 text-white px-2 py-1 rounded-md text-center ${
          user?.role === 'admin' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          <span className="font-semibold">{userRole}</span>
        </div>
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
                    : "text-gray-500 hover:bg-gray-700 hover:text-white"
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
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
});

export default AdminSidebar;
