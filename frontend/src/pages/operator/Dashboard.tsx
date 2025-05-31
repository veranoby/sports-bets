// Reemplazar TODO el contenido de frontend/src/pages/operator/Dashboard.tsx

import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Users, Activity } from "lucide-react";

const OperatorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Sports<span className="text-red-500">Bets</span>
                <span className="ml-2 text-sm bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  Panel de Operador
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Bienvenido, <strong>{user?.username}</strong>
              </span>
              <button
                onClick={() => navigate("/")}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={logout}
                className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Bienvenida */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Bienvenido al Panel de Operador!
          </h2>
          <p className="text-gray-600">
            Desde aquí podrás gestionar eventos, peleas y transmisiones en vivo.
          </p>
        </div>

        {/* Cards Informativas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Eventos</h3>
            </div>
            <p className="text-gray-600">
              Gestiona eventos y activa transmisiones en vivo.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Activity className="w-8 h-8 text-green-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Peleas</h3>
            </div>
            <p className="text-gray-600">
              Crea peleas, abre apuestas y registra resultados.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Settings className="w-8 h-8 text-purple-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Control</h3>
            </div>
            <p className="text-gray-600">
              Controla transmisiones y gestiona apuestas en tiempo real.
            </p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-800 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">📊 Debug Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Usuario:</strong> {user?.username || "No disponible"}
            </div>
            <div>
              <strong>Email:</strong> {user?.email || "No disponible"}
            </div>
            <div>
              <strong>Rol:</strong> {user?.role || "No disponible"}
            </div>
            <div>
              <strong>Estado:</strong> {user?.isActive ? "Activo" : "Inactivo"}
            </div>
          </div>
        </div>

        {/* Mensaje Desarrollo */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🚧 Panel en Desarrollo
          </h3>
          <p className="text-blue-700">
            Esta es una versión simplificada del panel de operador. Las
            funcionalidades completas de gestión de eventos, peleas y
            transmisiones se agregarán próximamente.
          </p>
        </div>
      </main>
    </div>
  );
};

export default OperatorDashboard;
