// frontend/src/contexts/UserThemeContext.tsx
// 🎨 NUEVO: Consistencia visual para rol USER

import React, { createContext, useContext } from "react";

interface UserThemeContextType {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: {
      main: string;
      card: string;
      header: string;
    };
    text: {
      primary: string;
      secondary: string;
      light: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

// 🎨 TEMA OFICIAL SPORTS BETS - ROL USER
const userTheme: UserThemeContextType = {
  colors: {
    primary: "#596c95", // Azul principal
    secondary: "#cd6263", // Rojo secundario
    accent: "#4a5b80", // Azul hover
    background: {
      main: "#1a1f37", // Fondo principal oscuro
      card: "#2a325c", // Cards oscuras
      header: "#2a325c", // Header consistente
    },
    text: {
      primary: "#ffffff", // Texto principal blanco
      secondary: "#e2e8f0", // Texto secundario gris claro
      light: "#94a3b8", // Texto ligero
    },
    status: {
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
  },
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
  },
  borderRadius: {
    sm: "0.375rem", // 6px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
  },
};

const UserThemeContext = createContext<UserThemeContextType>(userTheme);

export const useUserTheme = () => {
  const context = useContext(UserThemeContext);
  if (!context) {
    throw new Error("useUserTheme must be used within UserThemeProvider");
  }
  return context;
};

interface UserThemeProviderProps {
  children: React.ReactNode;
}

export const UserThemeProvider: React.FC<UserThemeProviderProps> = ({
  children,
}) => {
  return (
    <UserThemeContext.Provider value={userTheme}>
      {children}
    </UserThemeContext.Provider>
  );
};

// 🎨 UTILITY: Clases CSS dinámicas para componentes
export const getUserThemeClasses = () => ({
  // Layouts principales
  pageBackground: "bg-[#1a1f37] min-h-screen text-white",
  cardBackground: "bg-[#2a325c] border border-[#596c95] rounded-lg",
  headerBackground: "bg-[#2a325c] border-b border-[#596c95]",

  // Botones
  primaryButton:
    "bg-[#596c95] hover:bg-[#4a5b80] text-white font-medium px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#596c95] focus:ring-offset-2",
  secondaryButton:
    "bg-[#cd6263] hover:bg-[#b85456] text-white font-medium px-4 py-2 rounded-lg transition-colors",
  ghostButton:
    "border border-[#596c95] text-[#596c95] hover:bg-[#596c95] hover:text-white px-4 py-2 rounded-lg transition-colors",

  // Texto
  primaryText: "text-white",
  secondaryText: "text-gray-300",
  lightText: "text-gray-400",

  // Estados
  successText: "text-green-400",
  warningText: "text-yellow-400",
  errorText: "text-red-400",
  infoText: "text-blue-400",

  // Inputs
  input:
    "bg-[#1a1f37] border border-[#596c95] text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#596c95] focus:border-transparent",

  // Status chips
  activeChip:
    "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium",
  pendingChip:
    "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium",
  errorChip:
    "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium",
});
