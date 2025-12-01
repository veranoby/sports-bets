// frontend/src/components/admin/AdminHeader.tsx
// AdminHeader with stacked 2-row layout:
// Row 1: Logo + Title | Actions (Bell, User, Logout)
// Row 2: Real-time metrics bar (Memory, DB, Intervals, SSE + Quick actions)

import { memo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut, Bell } from "lucide-react";
import AdminHeaderMetricsBar from "./AdminHeaderMetricsBar";

const AdminHeader = memo(() => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-blue-200">
      {/* Row 1: Header with title and actions */}
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-theme-primary">
            Panel de monitoreo
          </h1>
          <div className="flex items-center gap-4">
            <button
              className="p-2 btn-primary hover:bg-theme-accent rounded-lg transition-colors"
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5 text-theme-secondary" />
            </button>
            <span className="text-sm text-theme-secondary">
              {user?.username}
            </span>
            <button
              onClick={logout}
              className="flex btn-primary items-center gap-2 px-3 py-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-accent rounded-lg transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
              {/* Row 2: Real-time metrics bar */}
      <AdminHeaderMetricsBar />
      </div>


    </header>
  );
});

export default AdminHeader;
