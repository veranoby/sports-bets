// frontend/src/pages/DebugTestPage.tsx
// ================================================================
// 🛠️ DEBUG PAGE: Página de testing rápido para todos los roles

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDebug } from "../hooks/useDebug";
import {
  User,
  Shield,
  Settings,
  Building2,
  FileText,
  ArrowRight,
  Bug,
  Zap,
  Eye,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

type Role = "admin" | "operator" | "venue" | "user" | "gallera";

interface RoleTestInfo {
  role: Role;
  label: string;
  icon: React.ReactNode;
  color: string;
  routes: string[];
  features: string[];
  issues?: string[];
}

const ROLE_TESTS: RoleTestInfo[] = [
  {
    role: "user",
    label: "Usuario",
    icon: <User className="w-5 h-5" />,
    color: "border-blue-500 bg-blue-50",
    routes: ["/user", "/user/events", "/user/bets", "/user/wallet", "/user/profile"],
    features: [
      "Dashboard con eventos del día",
      "Sistema premium con SubscriptionGuard",
      "Navegación móvil en bottom",
      "Estados vacíos mejorados",
      "WebSocket para eventos live"
    ]
  },
  {
    role: "admin",
    label: "Administrador",
    icon: <Shield className="w-5 h-5" />,
    color: "border-red-500 bg-red-50",
    routes: ["/admin", "/admin/users", "/admin/events", "/admin/finance", "/admin/venues"],
    features: [
      "Métricas del sistema",
      "Gestión completa de usuarios",
      "Control de eventos y finanzas", 
      "Panel de monitoreo",
      "Gestión de retiros"
    ]
  },
  {
    role: "operator",
    label: "Operador",
    icon: <Settings className="w-5 h-5" />,
    color: "border-green-500 bg-green-50",
    routes: ["/operator", "/operator/events", "/operator/stream"],
    features: [
      "Dashboard con WebSocket",
      "Control de peleas en vivo",
      "Gestión de streaming", 
      "Live stats y métricas",
      "Error de hoisting CORREGIDO"
    ],
    issues: []
  },
  {
    role: "venue",
    label: "Gallera Owner",
    icon: <Building2 className="w-5 h-5" />,
    color: "border-purple-500 bg-purple-50", 
    routes: ["/venue", "/venue/events"],
    features: [
      "Gestión de galleras",
      "Creación de eventos",
      "Estadísticas por evento",
      "Formularios con validación",
      "Estados de carga apropiados"
    ]
  },
  {
    role: "gallera",
    label: "Escritor",
    icon: <FileText className="w-5 h-5" />,
    color: "border-orange-500 bg-orange-50",
    routes: ["/gallera", "/gallera/articles"],
    features: [
      "Gestión de artículos",
      "Estadísticas de escritor", 
      "Estados vacíos mejorados",
      "Sistema de estado de artículos",
      "Navegación a artículos individuales"
    ]
  }
];

const DebugTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDebugMode, switchRole, log, isDev } = useDebug();

  // Solo mostrar en modo desarrollo
  if (!isDev) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Página no disponible
          </h1>
          <p className="text-gray-600">
            Esta página solo está disponible en modo desarrollo.
          </p>
        </div>
      </div>
    );
  }

  const currentRoleTest = ROLE_TESTS.find(test => test.role === user?.role);

  const handleRoleSwitch = (role: Role) => {
    log('info', `Testing role switch to: ${role}`);
    switchRole(role);
  };

  const handleRouteTest = (route: string) => {
    log('info', `Navigating to test route: ${route}`);
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bug className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Debug Testing Dashboard
            </h1>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              DESARROLLO
            </span>
          </div>
          
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">
                  Herramientas de Testing Activas
                </p>
                <p className="text-blue-800 text-sm">
                  Panel de debug en esquina superior derecha • 
                  Switcher de roles en esquina inferior derecha • 
                  Consola de logs disponible
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estado Actual */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Estado Actual</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {user ? (
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${currentRoleTest?.color || 'border-gray-300 bg-gray-50'}`}>
                  {currentRoleTest?.icon || <User className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {user.username} ({currentRoleTest?.label || user.role})
                  </h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    Autenticado
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No autenticado</p>
              </div>
            )}
          </div>
        </div>

        {/* Grid de Roles para Testing */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Test de Roles ({ROLE_TESTS.length} roles disponibles)
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {ROLE_TESTS.map((roleTest) => (
              <div
                key={roleTest.role}
                className={`bg-white rounded-lg border-2 p-6 ${roleTest.color} ${
                  user?.role === roleTest.role ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {roleTest.icon}
                    <h3 className="font-semibold text-gray-900">
                      {roleTest.label}
                    </h3>
                  </div>
                  {user?.role === roleTest.role && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>

                {/* Features */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">Funciones:</h4>
                  <ul className="space-y-1">
                    {roleTest.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Issues */}
                {roleTest.issues && roleTest.issues.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-red-600 mb-2 text-sm">Issues:</h4>
                    <ul className="space-y-1">
                      {roleTest.issues.map((issue, index) => (
                        <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 mt-1 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rutas */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">Rutas para probar:</h4>
                  <div className="space-y-1">
                    {roleTest.routes.map((route, index) => (
                      <button
                        key={index}
                        onClick={() => handleRouteTest(route)}
                        className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      >
                        {route}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div className="space-y-2">
                  {user?.role !== roleTest.role && (
                    <button
                      onClick={() => handleRoleSwitch(roleTest.role)}
                      className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      Cambiar a {roleTest.label}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleRouteTest(roleTest.routes[0])}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Dashboard
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            🛠️ Debug Testing Dashboard - Solo visible en desarrollo • 
            Usa las herramientas flotantes para más funciones
          </p>
        </div>
      </div>
    </div>
  );
};

export default DebugTestPage;