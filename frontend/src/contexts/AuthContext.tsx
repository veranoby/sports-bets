// frontend/src/contexts/AuthContext.tsx
// 🚨 MEJORAS PARA EVITAR RE-RENDERS QUE INTERFIEREN CON ERRORES

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
  useRef,
} from "react";
import { authAPI, usersAPI } from "../services/api";
import type { User, ApiResponse } from "../types";

// Tipos locales para respuestas del backend
interface AuthResponse {
  token: string;
  user: User;
}

interface ProfileResponseData {
  user: User;
  wallet: unknown;
  subscription?: User["subscription"];
}
interface ProfileResponse {
  success: boolean;
  data: ProfileResponseData;
}

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

// eslint-disable-next-line react-refresh/only-export-components
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
    localStorage.getItem("token"),
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
          // Usar perfil unificado que incluye subscription
          const response =
            (await usersAPI.getProfile()) as unknown as ProfileResponse;
          const u = response.data.user as User;
          setUser({ ...u, subscription: response.data.subscription });
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

        const response = (await authAPI.login(
          credentials,
        )) as ApiResponse<AuthResponse>;

        if (response.success) {
          const { token: authToken, user: userData } = response.data; // Backend response now direct

          // Guardar token y luego cargar perfil unificado (incluye subscription)
          localStorage.setItem("token", authToken);
          setToken(authToken);

          // Small delay to ensure axios interceptor can pick up the token
          await new Promise((resolve) => setTimeout(resolve, 50));

          try {
            const me = (await usersAPI.getProfile()) as ProfileResponse;
            if (me.success) {
              const u = me.data.user as User;
              setUser({ ...u, subscription: me.data.subscription });
            }
          } catch {
            // Si falla el fetch del perfil, al menos mantener usuario básico del login
            setUser(userData); // Fixed: user is in data.data, not data
          }
        } else {
          throw new Error(response.error || "Error al iniciar sesión");
        }
      } catch (error: unknown) {
        console.error("Login error:", error);

        // 🔧 MEJORA: Propagar error original sin modificar
        // para que el componente pueda manejarlo apropiadamente
        const originalError =
          error instanceof Error ? error.message : "Error al iniciar sesión";

        throw new Error(originalError);
      } finally {
        // Marcar que terminamos la operación
        isOperatingRef.current = false;
      }
    },
    [],
  );

  // 🔧 MEJORA 4: Register optimizado
  const register = useCallback(
    async (userData: {
      username: string;
      email: string;
      password: string;
      role?: string;
    }) => {
      isOperatingRef.current = true;

      try {
        const response = (await authAPI.register(
          userData,
        )) as ApiResponse<AuthResponse>;

        if (response.success) {
          const { token: authToken, user: newUserData } = response.data; // Backend response now direct

          setToken(authToken);
          localStorage.setItem("token", authToken);

          try {
            const me = (await usersAPI.getProfile()) as ProfileResponse;
            if (me.success) {
              const u = me.data.user as User;
              setUser({ ...u, subscription: me.data.subscription });
            }
          } catch {
            // fallback a user devuelto por register
            setUser(newUserData); // Fixed: user is in data.data
          }
        } else {
          throw new Error(response.error || "Error al registrarse");
        }
      } catch (error: unknown) {
        console.error("Register error:", error);

        const originalError =
          error instanceof Error ? error.message : "Error al registrarse";

        throw new Error(originalError);
      } finally {
        isOperatingRef.current = false;
      }
    },
    [],
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
      const response = (await usersAPI.getProfile()) as ProfileResponse;
      if (response.success) {
        const u = response.data.user as User;
        setUser({ ...u, subscription: response.data.subscription });
      }
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
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
