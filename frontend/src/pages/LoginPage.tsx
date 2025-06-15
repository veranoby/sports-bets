// frontend/src/pages/LoginPage.tsx
// ✅ OPTIMIZADO: Usando componente ErrorMessage existente con nuevas funcionalidades

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, UserPlus, Loader2, Info } from "lucide-react";
// ✅ Usar el componente ErrorMessage existente
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
  // ✅ Estado de error simple - el componente maneja el timeout
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Limpiar error anterior

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

      // ✅ Simplemente setear el error - ErrorMessage maneja el resto
      setError(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ✅ Limpiar error al cambiar inputs (mejor UX)
    if (error) {
      setError("");
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(""); // Limpiar error al cambiar modo
    setFormData({
      login: "",
      username: "",
      email: "",
      password: "",
    });
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
          {/* ✅ MENSAJE DE ERROR - Usando componente existente con nuevas props */}
          {error && (
            <div className="mb-6">
              <ErrorMessage
                error={error}
                variant="card"
                autoClose={true}
                duration={8000}
                showProgress={true}
                closeable={true}
                onClose={() => setError("")}
                className="shadow-sm"
              />
            </div>
          )}

          {/* ✅ CREDENCIALES DE PRUEBA - Más visible */}
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
            {/* Login field */}
            {isLoginMode && (
              <div>
                <label
                  htmlFor="login"
                  className="block text-sm font-medium text-gray-300"
                >
                  Email o Usuario
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
                    className="appearance-none block w-full px-3 py-2 border border-[#596c95] rounded-md shadow-sm bg-[#1a1f37] text-white placeholder-gray-400 focus:outline-none focus:ring-[#cd6263] focus:border-[#cd6263] sm:text-sm"
                    placeholder="admin@sportsbets.com"
                  />
                </div>
              </div>
            )}

            {/* Register fields */}
            {!isLoginMode && (
              <>
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Nombre de Usuario
                  </label>
                  <div className="mt-1">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-[#596c95] rounded-md shadow-sm bg-[#1a1f37] text-white placeholder-gray-400 focus:outline-none focus:ring-[#cd6263] focus:border-[#cd6263] sm:text-sm"
                      placeholder="usuario123"
                    />
                  </div>
                </div>

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
                      value={formData.email}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-[#596c95] rounded-md shadow-sm bg-[#1a1f37] text-white placeholder-gray-400 focus:outline-none focus:ring-[#cd6263] focus:border-[#cd6263] sm:text-sm"
                      placeholder="usuario@email.com"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password field */}
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
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-[#596c95] rounded-md shadow-sm bg-[#1a1f37] text-white placeholder-gray-400 focus:outline-none focus:ring-[#cd6263] focus:border-[#cd6263] sm:text-sm"
                  placeholder="••••••••"
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
