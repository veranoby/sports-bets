import React from "react";
import { Users, Shield, Edit, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import Card from "../../components/shared/Card";

const AdminUsers: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#1a1f37] text-white p-4">
      <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Ejemplo de tarjeta de usuario */}
        <Card className="bg-[#2a325c] p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#596c95] flex items-center justify-center">
              <span className="text-white">A</span>
            </div>
            <div>
              <h3 className="font-bold">Admin User</h3>
              <p className="text-sm text-gray-400">admin@example.com</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 rounded text-sm">
              <Edit size={14} /> Editar
            </button>
            <button className="flex items-center gap-1 px-3 py-1 bg-red-600 rounded text-sm">
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
