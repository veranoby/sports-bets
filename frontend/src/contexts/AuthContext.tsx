// frontend/src/contexts/AuthContext.tsx
// 🚨 MEJORAS PARA EVITAR RE-RENDERS QUE INTERFIEREN CON ERRORES

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { authAPI } from "../config/api";
import type { APIResponse, User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { login: string; password: string }) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [isLoading, setIsLoading] = useState(true);

  // 🔧 MEJORA 1: Ref para evitar re-renders durante operaciones críticas
  const isOperatingRef = useRef(false);

  const isAuthenticated = !!user && !!token;

  // 🔧 MEJORA 2: Cargar usuario solo una vez al inicio
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("token");
      if (savedToken && !isOperatingRef.current) {
        try {
          setIsLoading(true);
          const response: APIResponse<{ user: User; wallet: any }> =
            await authAPI.me();
          setUser(response.data.user);
          setToken(savedToken);
        } catch (error) {
          console.error("Error loading user:", error);
          // Token inválido, limpiar
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []); // Solo ejecutar una vez

  // 🔧 MEJORA 3: Login optimizado con mejor manejo de estados
  const login = useCallback(
    async (credentials: { login: string; password: string }) => {
      // Marcar que estamos en una operación crítica
      isOperatingRef.current = true;

      try {
        // 🔧 MEJORA: No setear isLoading inmediatamente para evitar re-renders
        // que puedan interfierir con el manejo de errores en el componente

        const response: APIResponse<{ user: User; token: string }> =
          await authAPI.login(credentials);

        const { user: userData, token: authToken } = response.data;

        // Solo actualizar estado si la operación fue exitosa
        setUser(userData);
        setToken(authToken);
        localStorage.setItem("token", authToken);
      } catch (error: any) {
        console.error("Login error:", error);

        // 🔧 MEJORA: Propagar error original sin modificar
        // para que el componente pueda manejarlo apropiadamente
        const originalError =
          error?.response?.data?.message ||
          error?.message ||
          "Error al iniciar sesión";

        throw new Error(originalError);
      } finally {
        // Marcar que terminamos la operación
        isOperatingRef.current = false;
      }
    },
    []
  );

  // 🔧 MEJORA 4: Register optimizado
  const register = useCallback(
    async (userData: { username: string; email: string; password: string }) => {
      isOperatingRef.current = true;

      try {
        const response: APIResponse<{ user: User; token: string }> =
          await authAPI.register(userData);

        const { user: newUser, token: authToken } = response.data;

        setUser(newUser);
        setToken(authToken);
        localStorage.setItem("token", authToken);
      } catch (error: any) {
        console.error("Register error:", error);

        const originalError =
          error?.response?.data?.message ||
          error?.message ||
          "Error al registrarse";

        throw new Error(originalError);
      } finally {
        isOperatingRef.current = false;
      }
    },
    []
  );

  // 🔧 MEJORA 5: Logout optimizado
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    isOperatingRef.current = false; // Reset estado operativo
  }, []);

  // 🔧 MEJORA 6: RefreshUser optimizado
  const refreshUser = useCallback(async () => {
    if (!token || isOperatingRef.current) return;

    try {
      const response: APIResponse<{ user: User; wallet: any }> =
        await authAPI.me();
      setUser(response.data.user);
    } catch (error) {
      console.error("Error refreshing user:", error);
      logout();
    }
  }, [token, logout]);

  // 🔧 MEJORA 7: Valor memoizado para evitar re-renders innecesarios
  const value = React.useMemo(
    (): AuthContextType => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshUser,
    }),
    [
      user,
      token,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
