import React, { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, FileText, BarChart3, Settings, Users } from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/gallera/dashboard",
    icon: Home,
  },
  {
    name: "My Articles",
    href: "/gallera/articles",
    icon: FileText,
  },
  {
    name: "Analytics",
    href: "/gallera/analytics",
    icon: BarChart3,
  },
  {
    name: "Community",
    href: "/gallera/community",
    icon: Users,
  },
  {
    name: "Profile",
    href: "/gallera/profile",
    icon: Settings,
  },
];

const GalleraNavigation = memo(() => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 sm:hidden z-50">
      <div className="flex justify-around">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

GalleraNavigation.displayName = "GalleraNavigation";

export default GalleraNavigation;