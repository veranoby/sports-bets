// frontend/src/components/admin/AdminSidebar.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  DollarSign,
  Building2,
  Radio,
  BarChart3,
  HelpCircle,
  LogOut,
  Shield,
  Monitor,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarItem {
  path: string;
  icon: React.ElementType;
  label: string;
  roles: Array<"admin" | "operator">; // Roles that can access this item
}

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const sidebarItems: SidebarItem[] = [
    {
      path: "/admin",
      icon: LayoutDashboard,
      label: "Dashboard",
      roles: ["admin", "operator"],
    },
    {
      path: "/admin/events",
      icon: Calendar,
      label: "Eventos",
      roles: ["admin", "operator"],
    },
    { path: "/admin/users", icon: Users, label: "Usuarios", roles: ["admin"] },
    {
      path: "/admin/venues",
      icon: Building2,
      label: "Galleras",
      roles: ["admin"],
    },
    {
      path: "/admin/bets",
      icon: DollarSign,
      label: "Apuestas",
      roles: ["admin"],
    },
    {
      path: "/admin/reports",
      icon: BarChart3,
      label: "Reportes",
      roles: ["admin"],
    },
    {
      path: "/admin/monitoring",
      icon: Monitor,
      label: "Monitoreo",
      roles: ["admin", "operator"],
    },
    {
      path: "/admin/streaming",
      icon: Radio,
      label: "Streaming",
      roles: ["admin", "operator"],
    },
    {
      path: "/admin/support",
      icon: HelpCircle,
      label: "Soporte",
      roles: ["admin"],
    },
    {
      path: "/admin/settings",
      icon: Settings,
      label: "Configuración",
      roles: ["admin"],
    },
  ];

  // Filter items based on user role
  const filteredItems = sidebarItems.filter((item) =>
    item.roles.includes(user?.role as "admin" | "operator"),
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">GalloBets Admin</h1>
        <div className="flex items-center mt-2 text-sm">
          <Shield className="w-4 h-4 mr-2" />
          <span className="capitalize">{user?.role}</span>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center p-2 rounded-lg ${
                    isActive
                      ? "bg-blue-400 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-2 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
