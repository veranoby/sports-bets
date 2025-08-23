// frontend/src/components/debug/RoleSwitcher.tsx
// ================================================================
// 🛠️ DEBUG TOOL: Role Switcher para testing de diferentes roles
// Solo visible en modo desarrollo

import React, { useState } from "react";
import { Settings, User, Shield, Building2, FileText, Crown } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type Role = "admin" | "operator" | "venue" | "user" | "gallera";

interface RoleInfo {
  role: Role;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const ROLES: RoleInfo[] = [
  {
    role: "user",
    label: "Usuario",
    icon: <User className="w-4 h-4" />,
    color: "bg-blue-500",
    description: "Usuario estándar con funciones básicas"
  },
  {
    role: "admin", 
    label: "Administrador",
    icon: <Shield className="w-4 h-4" />,
    color: "bg-red-500",
    description: "Acceso completo al sistema"
  },
  {
    role: "operator",
    label: "Operador", 
    icon: <Settings className="w-4 h-4" />,
    color: "bg-green-500",
    description: "Gestión de eventos y peleas"
  },
  {
    role: "venue",
    label: "Gallera",
    icon: <Building2 className="w-4 h-4" />,
    color: "bg-purple-500", 
    description: "Propietario de gallera"
  },
  {
    role: "gallera",
    label: "Escritor",
    icon: <FileText className="w-4 h-4" />,
    color: "bg-orange-500",
    description: "Creador de contenido"
  }
];

const RoleSwitcher: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  // Solo mostrar en modo desarrollo
  if (import.meta.env.PROD) {
    return null;
  }

  if (!user) {
    return null;
  }

  const currentRole = ROLES.find(r => r.role === user.role) || ROLES[0];

  const handleRoleChange = async (newRole: Role) => {
    setIsChanging(true);
    
    try {
      // Simular cambio de rol (en desarrollo)
      // En un entorno real, esto requeriría una API call
      
      // Crear un usuario mockup con el nuevo rol
      const mockUser = {
        ...user,
        role: newRole,
        username: `test_${newRole}`,
        email: `test_${newRole}@example.com`
      };

      // Actualizar localStorage para simular el cambio
      localStorage.setItem('debug_role', newRole);
      localStorage.setItem('debug_user', JSON.stringify(mockUser));
      
      // Recargar la página para aplicar el cambio
      window.location.reload();
      
    } catch (error) {
      console.error('Error changing role:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* Botón flotante */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`${currentRole.color} text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2`}
          title={`Rol actual: ${currentRole.label}`}
        >
          {currentRole.icon}
          <span className="font-medium text-sm">DEBUG</span>
        </button>

        {/* Panel de roles */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-80">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <Crown className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">Debug Role Switcher</h3>
            </div>

            <div className="space-y-2">
              {ROLES.map((roleInfo) => (
                <button
                  key={roleInfo.role}
                  onClick={() => handleRoleChange(roleInfo.role)}
                  disabled={isChanging || roleInfo.role === user.role}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    roleInfo.role === user.role
                      ? 'bg-gray-100 cursor-not-allowed'
                      : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <div className={`${roleInfo.color} text-white p-2 rounded-lg`}>
                    {roleInfo.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{roleInfo.label}</span>
                      {roleInfo.role === user.role && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          ACTUAL
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{roleInfo.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-2 border-t border-gray-200 text-xs text-gray-500">
              ⚠️ Solo visible en desarrollo
            </div>
          </div>
        )}
      </div>

      {/* Overlay para cerrar */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
};

export default RoleSwitcher;