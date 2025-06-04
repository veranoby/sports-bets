import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";

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
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError("");
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
              ? "Accede a tu cuenta para continuar"
              : "Únete a la plataforma de apuestas"}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#2a325c] border border-[#596c95] rounded-xl shadow-lg py-8 px-6 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLoginMode && (
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-300"
                >
                  Nombre de usuario
                </label>
                <div className="mt-1 relative">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required={!isLoginMode}
                    value={formData.username}
                    onChange={handleChange}
                    className="bg-[#1a1f37] text-white block w-full px-4 py-2 border border-[#596c95] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cd6263] focus:border-transparent"
                    placeholder="Ej: juan123"
                  />
                </div>
              </div>
            )}

            {!isLoginMode && (
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300"
                >
                  Correo electrónico
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required={!isLoginMode}
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-[#1a1f37] text-white block w-full px-4 py-2 border border-[#596c95] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cd6263] focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
            )}

            {isLoginMode && (
              <div>
                <label
                  htmlFor="login"
                  className="block text-sm font-medium text-gray-300"
                >
                  Usuario o Email
                </label>
                <div className="mt-1 relative">
                  <input
                    id="login"
                    name="login"
                    type="text"
                    required={isLoginMode}
                    value={formData.login}
                    onChange={handleChange}
                    className="bg-[#1a1f37] text-white block w-full px-4 py-2 border border-[#596c95] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cd6263] focus:border-transparent"
                    placeholder="usuario o email"
                  />
                </div>
              </div>
            )}

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
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-[#1a1f37] text-white block w-full px-4 py-2 border border-[#596c95] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cd6263] focus:border-transparent"
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
              {!isLoginMode && (
                <p className="mt-1 text-xs text-gray-500">
                  Mínimo 6 caracteres, incluyendo mayúscula, minúscula y número
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-[#cd6263] hover:bg-[#b55859] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cd6263] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : isLoginMode ? (
                  <LogIn className="w-4 h-4 mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isLoading
                  ? "Procesando..."
                  : isLoginMode
                  ? "Iniciar Sesión"
                  : "Crear Cuenta"}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#3a1f1f] border border-[#cd6263] rounded-lg">
                <AlertCircle className="h-5 w-5 text-[#cd6263]" />
                <p className="text-sm text-[#ff9e9e]">{error}</p>
              </div>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={toggleMode}
                className="w-full flex justify-center py-2 px-4 border border-[#596c95] rounded-lg shadow-sm text-sm font-medium text-gray-300 bg-transparent hover:bg-[#1a1f37] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#596c95] transition-colors"
              >
                {isLoginMode ? "Crear una cuenta nueva" : "Iniciar sesión"}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-[#1a1f37] border border-[#596c95] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-[#596c95]" />
              <h4 className="text-sm font-medium text-[#596c95]">
                Credenciales de Prueba
              </h4>
            </div>
            <div className="text-xs text-gray-400 space-y-1.5">
              <p>
                <span className="font-medium">Admin:</span> admin@sportsbets.com
                / admin123
              </p>
              <p>
                <span className="font-medium">Usuario:</span> testuser1 /
                Test123456
              </p>
              <p>
                <span className="font-medium">Operador:</span> operator1 /
                Operator123
              </p>
              <p>
                <span className="font-medium">Venue Owner:</span> venueowner /
                Venue123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
