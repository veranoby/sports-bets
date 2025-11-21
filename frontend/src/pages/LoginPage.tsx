// frontend/src/pages/LoginPage.tsx
// 🚨 SOLUCIÓN COMPLETA - Error Handling Mejorado

import React, { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, UserPlus, Loader2, Info } from "lucide-react";
import ErrorMessage from "../components/shared/ErrorMessage";
//import LoadingSpinner from "../components/shared/LoadingSpinner";

const LoginPage: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    login: "",
    username: "",
    email: "",
    password: "",
  });
  const [selectedRole, setSelectedRole] = useState<
    "user" | "venue" | "gallera"
  >("user");

  // 🔧 MEJORA 1: Estado de error más robusto
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔧 MEJORA 2: Función para mostrar error de forma persistente
  const displayError = (errorMessage: string) => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null; // Limpiar la referencia
    }
    setError(errorMessage);
    setShowError(true);
    // Eliminar el setTimeout que ocultaba el error automáticamente
  };

  // 🔧 MEJORA 3: Función para limpiar error manualmente
  const clearError = () => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    setShowError(false);
    setTimeout(() => setError(""), 300); // Transición suave
  };

  const [localIsLoading, setLocalIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalIsLoading(true);

    try {
      if (isLoginMode) {
        await login({
          login: formData.login,
          password: formData.password,
        });
      } else {
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          ...(selectedRole !== "user" ? { role: selectedRole } : {}),
        });
      }
      navigate("/");
    } catch (error: unknown) {
      let errorMessage = "Error desconocido al procesar la solicitud";

      if (error instanceof Error) {
        // Check for specific HTTP errors
        if (
          error.message.includes("409") ||
          error.message.toLowerCase().includes("sesión activa") ||
          error.message.toLowerCase().includes("session_conflict")
        ) {
          errorMessage = "Ya existe una sesión activa con este usuario. Cierra la sesión anterior antes de iniciar una nueva.";
        } else if (
          error.message.includes("401") ||
          error.message.toLowerCase().includes("invalid") ||
          error.message.toLowerCase().includes("unauthorized")
        ) {
          errorMessage = "Credenciales inválidas";
        } else if (
          error.message.includes("404") ||
          error.message.toLowerCase().includes("not found")
        ) {
          errorMessage = "Usuario no encontrado";
        } else if (
          error.message.includes("500") ||
          error.message.toLowerCase().includes("server")
        ) {
          errorMessage = "Error del servidor";
        } else if (
          error.message.toLowerCase().includes("network") ||
          error.message.toLowerCase().includes("fetch") ||
          error.message.toLowerCase().includes("connection")
        ) {
          errorMessage = "Error de conexión";
        } else {
          errorMessage = error.message;
        }
      }

      displayError(errorMessage);
    } finally {
      setLocalIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 🔧 MEJORA 6: NO limpiar error inmediatamente
    // Solo limpiar error si el usuario ha escrito algo significativo
    // y ha pasado tiempo suficiente desde que apareció el error
    if (error && value.length > 2) {
      const errorAge = Date.now() - (errorTimeoutRef.current ? 0 : 3000);
      if (errorAge > 3000) {
        // Solo limpiar si el error tiene más de 3 segundos
        clearError();
      }
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    clearError(); // Limpiar error al cambiar modo
    setFormData({
      login: "",
      username: "",
      email: "",
      password: "",
    });
  };

  // 🔧 MEJORA 7: Cleanup al desmontar componente
  React.useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="flex justify-center items-center gap-2">
            <img
              src="/src/assets/logo.png"
              alt="Logo Galleros.Net"
              className="h-24 w-24 object-contain"
            />
            <h1 className="text-4xl font-bold text-theme-primary">
              Galleros<span className="text-[#cd6263]">.Net</span>
            </h1>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-theme-primary">
            {isLoginMode ? "Iniciar Sesión" : "Crear Cuenta"}
          </h2>
          <p className="mt-2 text-sm text-theme-secondary">
            {isLoginMode
              ? "Accede a tu cuenta para disfrutar de las transmisiones"
              : "Crea tu cuenta para empezar a apostar"}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 🔧 MEJORA 8: Error Message mejorado con mejor visualización */}
            {showError && error && (
              <div className="mb-4">
                <ErrorMessage
                  error={error}
                  onClose={clearError}
                  className="border-l-4 border-l-red-500 bg-red-50 shadow-sm animate-slide-down"
                />
              </div>
            )}

            {/* Login/Email Field */}
            {isLoginMode ? (
              <div>
                <label
                  htmlFor="login"
                  className="block text-sm font-medium text-gray-700"
                >
                  Usuario o Email
                </label>
                <div className="mt-1">
                  <input
                    id="login"
                    name="login"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.login}
                    onChange={handleChange}
                    disabled={localIsLoading || isLoading}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#596c95] focus:border-[#596c95] disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Username Field */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nombre de Usuario
                  </label>
                  <div className="mt-1">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      disabled={localIsLoading || isLoading}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#596c95] focus:border-[#596c95] disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="tu_usuario"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      disabled={localIsLoading || isLoading}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#596c95] focus:border-[#596c95] disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                {/* Role Selection - Only in registration mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Cuenta
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="user"
                        checked={selectedRole === "user"}
                        onChange={() => setSelectedRole("user")}
                        disabled={localIsLoading || isLoading}
                        className="h-4 w-4 text-[#596c95] focus:ring-[#596c95] border-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Usuario Normal (Público)
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="venue"
                        checked={selectedRole === "venue"}
                        onChange={() => setSelectedRole("venue")}
                        disabled={localIsLoading || isLoading}
                        className="h-4 w-4 text-[#596c95] focus:ring-[#596c95] border-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Propietario de Venue
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="gallera"
                        checked={selectedRole === "gallera"}
                        onChange={() => setSelectedRole("gallera")}
                        disabled={localIsLoading || isLoading}
                        className="h-4 w-4 text-[#596c95] focus:ring-[#596c95] border-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Propietario de Gallera
                      </span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    isLoginMode ? "current-password" : "new-password"
                  }
                  required
                  value={formData.password}
                  onChange={handleChange}
                  disabled={localIsLoading || isLoading}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#596c95] focus:border-[#596c95] disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={localIsLoading || isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={localIsLoading || isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#596c95] hover:bg-[#4a5a85] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#596c95] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {localIsLoading || isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {isLoginMode ? (
                      <LogIn className="w-4 h-4 mr-2" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    {isLoginMode ? "Iniciar Sesión" : "Crear Cuenta"}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Mode Toggle */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isLoginMode ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={toggleMode}
                disabled={localIsLoading || isLoading}
                className="w-full text-center text-sm text-[#596c95] hover:text-[#4a5a85] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoginMode ? "Crear nueva cuenta" : "Iniciar sesión"}
              </button>
            </div>
          </div>

          {/* Demo Credentials */}
          {isLoginMode && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-start">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-xs text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">
                    Credenciales de prueba:
                  </p>
                  <p>
                    <strong>Admin:</strong> admin_test / Admin123456
                  </p>
                  <p>
                    <strong>Usuario:</strong> user_test / User123456
                  </p>
                  <p>
                    <strong>Operador:</strong> operator_test / Operator123456
                  </p>
                  <p>
                    <strong>Gallera:</strong> gallera_test / Gallera123456
                  </p>
                  <p>
                    <strong>Venue:</strong> criadero_test / Criadero123456
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
