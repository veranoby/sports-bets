// frontend/src/components/shared/Card.tsx
// 🎴 COMPONENTE UNIFICADO - Reemplaza Card.tsx + DataCard.tsx

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendData {
  value: number;
  direction: "up" | "down" | "neutral";
  period?: string;
}

interface CardProps {
  // Básico
  title?: string;
  children?: React.ReactNode;
  className?: string;

  // DataCard functionality
  value?: string | number;
  icon?: React.ReactNode;
  trend?: TrendData | "up" | "down" | "neutral";
  description?: string;

  // Variants
  variant?: "default" | "stat" | "info" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";

  // Color themes
  color?: "blue" | "red" | "green" | "yellow" | "gray" | "purple" | "white";

  // Interactions
  onClick?: () => void;
  href?: string;

  // Advanced
  loading?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  className = "",
  value,
  icon,
  trend,
  description,
  variant = "default",
  size = "md",
  color = "blue",
  onClick,
  href,
  loading = false,
  disabled = false,
  highlighted = false,
}) => {
  // Determinar si es una DataCard o Card normal
  const isDataCard = value !== undefined || icon !== undefined;

  // Clases base según variante
  const getBaseClasses = () => {
    const baseClasses = "rounded-lg transition-all duration-200";

    switch (variant) {
      case "stat":
        return `${baseClasses} bg-theme-card border border-[#596c95]`;
      case "info":
        return `${baseClasses} bg-blue-50 border border-blue-200 text-blue-900`;
      case "success":
        return `${baseClasses} bg-green-50 border border-green-200 text-green-900`;
      case "warning":
        return `${baseClasses} bg-yellow-50 border border-yellow-200 text-yellow-900`;
      case "error":
        return `${baseClasses} bg-red-50 border border-red-200 text-red-900`;
      default:
        return `${baseClasses}  border border-[#596c95]`;
    }
  };

  // Clases de tamaño
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "p-3";
      case "lg":
        return "p-8";
      default:
        return "p-6";
    }
  };

  // Clases de color para DataCard
  const getColorClasses = () => {
    const colorMap = {
      blue: {
        icon: "text-[#596c95]",
        bg: "bg-[#596c95]/10",
        accent: "text-[#596c95]",
      },
      red: {
        icon: "text-[#cd6263]",
        bg: "bg-[#cd6263]/10",
        accent: "text-[#cd6263]",
      },
      green: {
        icon: "text-green-400",
        bg: "bg-green-400/10",
        accent: "text-green-400",
      },
      yellow: {
        icon: "text-yellow-400",
        bg: "bg-yellow-400/10",
        accent: "text-yellow-400",
      },
      gray: {
        icon: "text-gray-400",
        bg: "bg-gray-400/10",
        accent: "text-gray-400",
      },
      purple: {
        icon: "text-purple-400",
        bg: "bg-purple-400/10",
        accent: "text-purple-400",
      },
      white: {
        icon: "text-gray-800",
        bg: "bg-white",
        accent: "text-gray-800",
      },
    };

    return colorMap[color] || colorMap.blue;
  };

  // Clases de interacción
  const getInteractionClasses = () => {
    if (disabled) return "opacity-50 cursor-not-allowed";
    if (onClick || href)
      return "cursor-pointer hover:bg-opacity-20 hover:shadow-lg hover:scale-101";
    return "";
  };

  // Clases de destacado
  const getHighlightClasses = () => {
    return highlighted ? "ring-2 ring-[#cd6263] ring-opacity-50" : "";
  };

  // Renderizar icono
  const renderIcon = () => {
    if (!icon) return null;

    const colors = getColorClasses();
    const iconSize =
      size === "sm" ? "w-5 h-5" : size === "lg" ? "w-8 h-8" : "w-6 h-6";

    if (React.isValidElement(icon)) {
      return React.cloneElement(
        icon as React.ReactElement,
        {
          className: `${iconSize} ${colors.icon}`,
        }
      );
    }

    // Si es un componente de icono de Lucide
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className={`${iconSize} ${colors.icon}`} />;
  };

  // Renderizar trend
  const renderTrend = () => {
    if (!trend) return null;

    let trendDirection: "up" | "down" | "neutral";
    let trendValue: number | undefined;
    let trendPeriod: string | undefined;

    if (typeof trend === "string") {
      trendDirection = trend;
    } else {
      trendDirection = trend.direction;
      trendValue = trend.value;
      trendPeriod = trend.period;
    }

    const TrendIcon =
      trendDirection === "up"
        ? TrendingUp
        : trendDirection === "down"
          ? TrendingDown
          : Minus;

    const trendColor =
      trendDirection === "up"
        ? "text-green-400"
        : trendDirection === "down"
          ? "text-red-400"
          : "text-gray-400";

    return (
      <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
        <TrendIcon className="w-4 h-4" />
        {trendValue !== undefined && <span>{Math.abs(trendValue)}%</span>}
        {trendPeriod && <span className="text-gray-400">{trendPeriod}</span>}
      </div>
    );
  };

  // Manejar click
  const handleClick = () => {
    if (disabled) return;
    if (href) {
      window.location.href = href;
    } else if (onClick) {
      onClick();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`${getBaseClasses()} ${getSizeClasses()} ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded mb-2"></div>
          <div className="h-8 bg-gray-600 rounded mb-2"></div>
          <div className="h-3 bg-gray-600 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const cardClasses = `
    ${getBaseClasses()}
    ${getSizeClasses()}
    ${getInteractionClasses()}
    ${getHighlightClasses()}
    ${className}
  `.trim();

  if (isDataCard) {
    // Renderizar como DataCard
    const colors = getColorClasses();

    return (
      <div className={cardClasses} onClick={handleClick}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {title && <p className="text-gray-400 text-sm mb-1">{title}</p>}

            <div className="flex items-center gap-3">
              {value && (
                <p
                  className={`font-bold ${
                    size === "sm"
                      ? "text-lg"
                      : size === "lg"
                        ? "text-3xl"
                        : "text-2xl"
                  } text-white`}
                >
                  {value}
                </p>
              )}

              {renderTrend()}
            </div>

            {description && (
              <p className="text-gray-400 text-xs mt-1">{description}</p>
            )}
          </div>

          {/* Añadir espacio para el mini-chart si viene en children */}
          {children ? (
            <div className="w-1/3 h-full flex items-center justify-center">
              {children}
            </div>
          ) : (
            icon && (
              <div className={`ml-4 p-2 rounded-lg ${colors.bg}`}>
                {renderIcon()}
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // Renderizar como Card normal
  return (
    <div className={cardClasses} onClick={handleClick}>
      {title && (
        <div className="mb-4">
          <h3
            className={`font-semibold ${
              size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl"
            } text-white`}
          >
            {title}
          </h3>
        </div>
      )}

      {children}
    </div>
  );
};

export default Card;
