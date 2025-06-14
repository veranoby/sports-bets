/**
 * Admin Dashboard Component
 * Panel principal para administradores del sistema
 */
"use client";

import React, { useState } from "react";
import { Users, Clock, BarChart2, Server } from "lucide-react";
import UserManagementTable from "../../components/admin/UserManagementTable";
import VenueApprovalPanel from "../../components/admin/VenueApprovalPanel";
import FinancialStats from "../../components/admin/FinancialStats";
import SystemMonitoring from "../../components/admin/SystemMonitoring";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import StatCard from "../../components/shared/StatCard";

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("users");
  const { logout } = useAuth();
  const [usersLoading, setUsersLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState(0);

  const handleFetchData = async () => {
    try {
      setUsersLoading(true);
      setEventsLoading(true);
      setReportsLoading(true);
      // Simulate fetching data
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setActiveUsers(100); // Assuming a default value for activeUsers
    } catch (e) {
      console.error("Error fetching data:", e);
      setError("Error al cargar los datos. Por favor, inténtelo más tarde.");
    } finally {
      setUsersLoading(false);
      setEventsLoading(false);
      setReportsLoading(false);
    }
  };

  const fetchData = () => {
    handleFetchData();
  };

  if (usersLoading || eventsLoading || reportsLoading) {
    return <LoadingSpinner text="Cargando datos administrativos..." />;
  }

  return (
    <div className="min-h-screen bg-[#1a1f37] text-white">
      {/* Header */}
      <header className="bg-[#2a325c] border-b border-[#596c95] p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Panel de Administración</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Admin</span>
            <button
              onClick={logout}
              className="text-gray-300 hover:text-white text-sm"
            >
              Cerrar sesión
            </button>
            <div className="h-8 w-8 rounded-full bg-[#cd6263] flex items-center justify-center">
              <span className="text-white">A</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="p-4">
        <div className="flex border-b border-[#596c95]">
          {[
            {
              id: "users",
              icon: <Users className="w-4 h-4" />,
              label: "Usuarios",
            },
            {
              id: "venues",
              icon: <Clock className="w-4 h-4" />,
              label: "Aprobación de Locales",
            },
            {
              id: "finance",
              icon: <BarChart2 className="w-4 h-4" />,
              label: "Finanzas",
            },
            {
              id: "monitoring",
              icon: <Server className="w-4 h-4" />,
              label: "Monitoreo",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 ${
                activeTab === tab.id
                  ? "border-b-2 border-[#cd6263]"
                  : "text-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "users" && (
          <div className="bg-[#2a325c] border border-[#596c95] rounded-lg shadow-lg p-4">
            {usersLoading ? (
              <LoadingSpinner size="md" className="my-8" />
            ) : error ? (
              <ErrorMessage error={error} onRetry={fetchData} />
            ) : (
              <>
                <UserManagementTable />
                <StatCard
                  title="Usuarios Activos"
                  value={activeUsers}
                  change={{
                    value: 8.2,
                    trend: "up",
                    period: "mes pasado",
                  }}
                  color="green"
                  icon={<Users className="w-5 h-5" />}
                />
              </>
            )}
          </div>
        )}
        {activeTab === "venues" && (
          <div className="bg-[#2a325c] border border-[#596c95] rounded-lg shadow-lg p-4">
            {eventsLoading ? (
              <LoadingSpinner size="md" className="my-8" />
            ) : error ? (
              <ErrorMessage error={error} onRetry={fetchData} />
            ) : (
              <VenueApprovalPanel />
            )}
          </div>
        )}
        {activeTab === "finance" && (
          <div className="bg-[#2a325c] border border-[#596c95] rounded-lg shadow-lg p-4">
            {reportsLoading ? (
              <LoadingSpinner size="md" className="my-8" />
            ) : error ? (
              <ErrorMessage error={error} onRetry={fetchData} />
            ) : (
              <FinancialStats />
            )}
          </div>
        )}
        {activeTab === "monitoring" && (
          <div className="bg-[#2a325c] border border-[#596c95] rounded-lg shadow-lg p-4">
            {eventsLoading ? (
              <LoadingSpinner size="md" className="my-8" />
            ) : error ? (
              <ErrorMessage error={error} onRetry={fetchData} />
            ) : (
              <SystemMonitoring />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
