// frontend/src/components/shared/Breadcrumbs.tsx
// ================================================================
// 🍞 BREADCRUMBS: Navegación de migas de pan universal para todos los roles

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

// Mapas de rutas por rol para generar breadcrumbs inteligentes
const ROLE_ROUTES: Record<string, Record<string, string>> = {
  user: {
    "/dashboard": "Dashboard",
    "/events": "Eventos",
    "/bets": "Mis Apuestas",
    "/wallet": "Cartera",
    "/profile": "Perfil",
    "/subscriptions": "Suscripciones",
    "/news": "Noticias",
    "/venues": "Galleras",
    // Paths for unified dashboard (venue/gallera specific sections)
    "/dashboard/my-venues": "Mis Galleras", // For venue role
    "/dashboard/my-articles": "Mis Artículos", // For gallera role
  },
  admin: {
    "/admin": "Dashboard",
    "/admin/users": "Usuarios",
    "/admin/events": "Eventos",
    "/admin/finance": "Finanzas",
    "/admin/venues": "Galleras",
    "/admin/articles": "Artículos",
    "/admin/operators": "Operadores",
    "/admin/requests": "Solicitudes",
    "/admin/monitoring": "Monitoreo",
  },
  operator: {
    "/operator": "Dashboard",
    "/operator/events": "Eventos",
    "/operator/stream": "Streaming",
  },
};

const ROLE_HOME: Record<string, { path: string; label: string }> = {
  user: { path: "/dashboard", label: "Inicio" },
  admin: { path: "/admin", label: "Admin" },
  operator: { path: "/operator", label: "Operador" },
  venue: { path: "/dashboard", label: "Inicio" }, // Redirect venue to user dashboard
  gallera: { path: "/dashboard", label: "Inicio" }, // Redirect gallera to user dashboard
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const pathname = location.pathname;
  const userRole = user.role;

  // No mostrar breadcrumbs en la página principal del rol
  const roleHome = ROLE_HOME[userRole];
  if (!roleHome || pathname === roleHome.path) {
    return null;
  }

  // Generar breadcrumbs basado en la ruta actual
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];

    // Siempre empezar con Home del rol
    items.push({
      label: roleHome.label,
      href: roleHome.path,
      icon: <Home className="w-4 h-4" />,
    });

    // Obtener rutas del rol actual
    const roleRoutes = ROLE_ROUTES[userRole] || {};

    // Si la ruta actual está en el mapa, agregarlo
    if (roleRoutes[pathname]) {
      items.push({
        label: roleRoutes[pathname],
      });
    } else {
      // Intentar construir breadcrumbs desde segmentos de URL
      const segments = pathname.split("/").filter(Boolean);
      let currentPath = "";

      segments.forEach((segment, index) => {
        currentPath += `/${segment}`;

        // Solo agregar si no es el home (ya agregado)
        if (currentPath !== roleHome.path && roleRoutes[currentPath]) {
          // Si es el último segmento, no agregar href (página actual)
          const isLast = index === segments.length - 1;
          items.push({
            label: roleRoutes[currentPath],
            href: isLast ? undefined : currentPath,
          });
        } else if (index === segments.length - 1 && !roleRoutes[currentPath]) {
          // Último segmento sin mapeo - usar el segmento capitalizado
          items.push({
            label:
              segment.charAt(0).toUpperCase() +
              segment.slice(1).replace("-", " "),
          });
        }
      });
    }

    return items;
  };

  const breadcrumbs = generateBreadcrumbs();

  // No mostrar si solo hay un elemento (ya estamos en home)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-16 z-30">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />}

          {item.href ? (
            <Link
              to={item.href}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#596c95]/10 transition-all duration-200 group"
            >
              {item.icon && (
                <span className="text-[#596c95] group-hover:text-[#cd6263] transition-colors">
                  {item.icon}
                </span>
              )}
              <span className="text-[#596c95] font-medium group-hover:text-[#cd6263] transition-colors">
                {item.label}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#cd6263]/10 text-[#cd6263] font-medium">
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </div>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
