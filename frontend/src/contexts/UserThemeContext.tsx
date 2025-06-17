// REEMPLAZAR TODO EL CONTENIDO
import React, { createContext, useContext, useEffect } from "react";

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
  updateColors: (newColors: Partial<UserThemeContextType["colors"]>) => void;
}

// 🎨 TEMA DINÁMICO SPORTS BETS
const defaultTheme = {
  colors: {
    primary: "#596c95",
    secondary: "#cd6263",
    accent: "#4a5b80",
    background: {
      main: "#1a1f37e3",
      card: "#2a325c",
      header: "#2a325c",
    },
    text: {
      primary: "#ffffff",
      secondary: "#e2e8f0",
      light: "#94a3b8",
    },
    status: {
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  borderRadius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
  },
};

const UserThemeContext = createContext<UserThemeContextType | null>(null);

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
  const [theme, setTheme] = React.useState(defaultTheme);

  // 🎨 INYECTAR CSS VARIABLES DINÁMICAMENTE
  useEffect(() => {
    const root = document.documentElement;

    // Aplicar variables CSS
    root.style.setProperty("--color-primary", theme.colors.primary);
    root.style.setProperty("--color-secondary", theme.colors.secondary);
    root.style.setProperty("--color-accent", theme.colors.accent);
    root.style.setProperty("--color-bg-main", theme.colors.background.main);
    root.style.setProperty("--color-bg-card", theme.colors.background.card);
    root.style.setProperty("--color-bg-header", theme.colors.background.header);
    root.style.setProperty("--color-text-primary", theme.colors.text.primary);
    root.style.setProperty(
      "--color-text-secondary",
      theme.colors.text.secondary
    );
    root.style.setProperty("--color-text-light", theme.colors.text.light);
    root.style.setProperty("--color-success", theme.colors.status.success);
    root.style.setProperty("--color-warning", theme.colors.status.warning);
    root.style.setProperty("--color-error", theme.colors.status.error);
    root.style.setProperty("--color-info", theme.colors.status.info);
  }, [theme]);

  const updateColors = (newColors: Partial<UserThemeContextType["colors"]>) => {
    setTheme((prev) => ({
      ...prev,
      colors: { ...prev.colors, ...newColors },
    }));
  };

  const value: UserThemeContextType = {
    ...theme,
    updateColors,
  };

  return (
    <UserThemeContext.Provider value={value}>
      {children}
    </UserThemeContext.Provider>
  );
};

// 🎨 UTILITY: Clases CSS usando CSS Variables
export const getUserThemeClasses = () => ({
  // Layouts principales
  pageBackground: "min-h-screen text-white bg-theme-main",
  cardBackground: "bg-theme-card border border-theme-primary rounded-lg",
  headerBackground: "bg-theme-header border-b border-theme-primary",

  // Botones
  primaryButton:
    "bg-theme-primary hover:bg-theme-accent text-white font-medium px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2",
  secondaryButton:
    "bg-theme-secondary hover:opacity-90 text-white font-medium px-4 py-2 rounded-lg transition-colors",
  ghostButton:
    "border border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white px-4 py-2 rounded-lg transition-colors",

  // Texto
  primaryText: "text-theme-text-primary",
  secondaryText: "text-theme-text-secondary",
  lightText: "text-theme-text-light",

  // Estados
  successText: "text-theme-success",
  warningText: "text-theme-warning",
  errorText: "text-theme-error",
  infoText: "text-theme-info",

  // Inputs
  input:
    "bg-theme-main border border-theme-primary text-theme-text-primary placeholder:text-theme-text-light rounded-lg px-3 py-2 focus:ring-2 focus:ring-theme-primary focus:border-transparent",

  // Status chips
  activeChip:
    "bg-theme-success/20 text-theme-success px-2 py-1 rounded-full text-xs font-medium",
  pendingChip:
    "bg-theme-warning/20 text-theme-warning px-2 py-1 rounded-full text-xs font-medium",
  errorChip:
    "bg-theme-error/20 text-theme-error px-2 py-1 rounded-full text-xs font-medium",

  gradientHeader: "bg-gradient-theme-header",
  gradientUserButton:
    "bg-gradient-theme-user-button hover:bg-gradient-theme-user-button-hover",
  gradientNav: "bg-gradient-theme-nav",
});
