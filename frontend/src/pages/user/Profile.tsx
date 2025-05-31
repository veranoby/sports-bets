/**
 * Profile Component
 * Página de perfil del usuario con información personal y opciones de cuenta.
 */
"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ChevronLeft } from "lucide-react";

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-gray-700 hover:text-gray-900"
              aria-label="Volver al dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="ml-1">Volver</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              Mi <span className="text-red-500">Perfil</span>
            </h1>
            <div className="w-5"></div> {/* Espacio para alinear el título */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Información del usuario */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Información Personal
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nombre de usuario</p>
              <p className="text-gray-900 font-medium">
                {user?.username || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Correo electrónico</p>
              <p className="text-gray-900 font-medium">
                {user?.email || "N/A"}
              </p>
            </div>
          </div>
        </section>

        {/* Formulario placeholder para edición */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Editar Perfil
          </h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Nombre de usuario
              </label>
              <input
                type="text"
                placeholder="Nuevo nombre de usuario"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="Nuevo correo electrónico"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              type="button"
              className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
            >
              Guardar Cambios
            </button>
          </form>
        </section>

        {/* Botón de logout */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <button
            onClick={logout}
            className="w-full bg-gray-100 text-red-500 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cerrar Sesión
          </button>
        </section>
      </main>
    </div>
  );
};

export default Profile;
