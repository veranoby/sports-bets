// frontend/src/pages/LoginPage.tsx
// ✅ SOLUCION COMPLETA: Error handling que permite leer los mensajes

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, UserPlus, Loader2, Info } from "lucide-react";
import ErrorMessage from "../components/shared/ErrorMessage";

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

  // ✅ SOLUCION 1: Estado de error con timeout personalizado
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ SOLUCION 2: Función para limpiar error con delay
  const clearErrorWithDelay = (delay: number = 3000) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setError("");
      setIsTyping(false);
    }, delay);
  };

  // ✅ SOLUCION 3: Limpiar timeout al desmontar componente
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ SOLUCION 4: NO limpiar error inmediatamente, solo cancelar timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);

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
        });
      }
      navigate("/");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al procesar la solicitud";

      // ✅ SOLUCION 5: Limpiar error anterior solo al mostrar nuevo error
      setError(errorMessage);
      // No configurar auto-clear aquí, dejar que el usuario lo lea
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ✅ SOLUCION 6: Solo marcar como "escribiendo", NO limpiar error inmediatamente
    if (error && !isTyping) {
      setIsTyping(true);
      // Limpiar error solo después de 3 segundos de estar escribiendo
      clearErrorWithDelay(3000);
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);

    // ✅ SOLUCION 7: Solo limpiar error si el usuario ya estaba escribiendo
    if (isTyping) {
      setError("");
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    setFormData({
      login: "",
      username: "",
      email: "",
      password: "",
    });
  };

  // ✅ SOLUCION 8: Función manual para cerrar error
  const handleCloseError = () => {
    setError("");
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f37] to-[#2a325c] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            Sports<span className="text-[#cd6263]">Bets</span>
          </h1>
          <h2 className="mt-6 text-2xl font-bold text-white">
            {isLoginMode ? "Iniciar Sesión" : "Crear Cuenta"}
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            {isLoginMode
              ? "Ingresa tus credenciales para acceder"
              : "Crea una nueva cuenta para comenzar"}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#2a325c] py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-[#596c95]">
          {/* ✅ SOLUCION 9: Error message optimizado para lectura */}
          {error && (
            <div className="mb-6">
              <ErrorMessage
                error={error}
                variant="card"
                autoClose={false} // ✅ NO auto-close automático
                closeable={true} // ✅ Permitir cerrar manualmente
                onClose={handleCloseError}
                className="shadow-sm border-l-4 border-l-red-500"
              />
              {/* ✅ SOLUCION 10: Indicador visual de que el error se borrará */}
              {isTyping && (
                <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                  <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full"></div>
                  Este mensaje se ocultará en unos segundos...
                </div>
              )}
            </div>
          )}

          {/* Credenciales de prueba */}
          <div className="mb-6 bg-[#1a1f37] border border-[#596c95] rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-400 mb-2">
                  Credenciales de Prueba
                </h3>
                <div className="text-xs text-gray-300 space-y-1">
                  <p>
                    <strong>Admin:</strong> admin@sportsbets.com / admin123
                  </p>
                  <p>
                    <strong>Usuario:</strong> testuser1 / Test123456
                  </p>
                  <p>
                    <strong>Operador:</strong> operator1 / Operator123
                  </p>
                  <p>
                    <strong>Venue Owner:</strong> venueowner / Venue123
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Campo login/username */}
            <div>
              <label
                htmlFor={isLoginMode ? "login" : "username"}
                className="block text-sm font-medium text-gray-300"
              >
                {isLoginMode ? "Email o Usuario" : "Nombre de Usuario"}
              </label>
              <div className="mt-1">
                <input
                  id={isLoginMode ? "login" : "username"}
                  name={isLoginMode ? "login" : "username"}
                  type="text"
                  autoComplete={isLoginMode ? "username" : "username"}
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-[#596c95] placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-[#cd6263] focus:border-[#cd6263] focus:z-10 sm:text-sm"
                  placeholder={
                    isLoginMode
                      ? "admin@sportsbets.com"
                      : "Tu nombre de usuario"
                  }
                  value={isLoginMode ? formData.login : formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Campo email (solo registro) */}
            {!isLoginMode && (
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300"
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
                    className="appearance-none relative block w-full px-3 py-2 border border-[#596c95] placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-[#cd6263] focus:border-[#cd6263] focus:z-10 sm:text-sm"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* Campo password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
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
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-[#596c95] placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-[#cd6263] focus:border-[#cd6263] focus:z-10 sm:text-sm"
                  placeholder={isLoginMode ? "admin123" : "Tu contraseña"}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#cd6263] hover:bg-[#b55456] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cd6263] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
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

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#596c95]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#2a325c] text-gray-400">
                  {isLoginMode ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={toggleMode}
                className="w-full text-center text-sm text-[#cd6263] hover:text-[#b55456] font-medium transition-colors"
              >
                {isLoginMode ? "Crear una cuenta nueva" : "Iniciar sesión aquí"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
