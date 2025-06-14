import React from "react";
import type { LucideIcon } from "lucide-react";

interface CardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: "data" | "stat" | "info";
  color?: "blue" | "red" | "green" | "gray";
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    period?: string;
  };
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "info",
  color = "gray",
  trend,
  className = "",
  children,
  onClick,
}) => {
  const colorClasses = {
    blue: "border-[#596c95] bg-blue-50",
    red: "border-[#cd6263] bg-red-50",
    green: "border-green-500 bg-green-50",
    gray: "border-gray-200 bg-white",
  };

  const baseClasses = `rounded-lg border p-4 ${colorClasses[color]} ${
    onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""
  } ${className}`;

  return (
    <div className={baseClasses} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {value && (
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          )}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs font-medium ${
                  trend.direction === "up"
                    ? "text-green-600"
                    : trend.direction === "down"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {trend.direction === "up"
                  ? "↗"
                  : trend.direction === "down"
                  ? "↘"
                  : "→"}{" "}
                {Math.abs(trend.value)}%
              </span>
              {trend.period && (
                <span className="text-xs text-gray-500">vs {trend.period}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={`p-2 rounded-lg ${
              color === "blue"
                ? "bg-[#596c95]"
                : color === "red"
                ? "bg-[#cd6263]"
                : "bg-gray-500"
            } text-white`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {children && (
        <div className="mt-4 pt-4 border-t border-gray-200">{children}</div>
      )}
    </div>
  );
};

export default Card;
