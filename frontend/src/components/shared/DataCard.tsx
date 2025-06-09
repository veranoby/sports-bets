import React from "react";

interface DataCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  color?: "blue" | "red" | "green" | "gray" | "yellow";
  size?: "sm" | "md" | "lg";
}

/**
 * DataCard Component
 * Reusable card component for displaying statistics with optional icon and trend indicator
 *
 * @param {string} title - Card title
 * @param {string|number} value - Main value to display
 * @param {React.ReactNode} [icon] - Optional icon to display
 * @param {'up'|'down'|'neutral'} [trend] - Optional trend indicator
 * @param {'blue'|'red'|'green'|'yellow'|'gray'} [color='blue'] - Card color theme
 * @param {'sm'|'md'|'lg'} [size='md'] - Size of the card
 */
const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = "blue",
  size = "md",
}) => {
  const colorConfig = {
    blue: { bg: "#596c95", text: "white" },
    red: { bg: "#cd6263", text: "white" },
    green: { bg: "#10b981", text: "white" },
    yellow: { bg: "#f59e0b", text: "white" },
    gray: { bg: "#6b7280", text: "white" },
  };

  const sizeClasses = {
    sm: "p-2 text-sm",
    md: "p-4 text-base",
    lg: "p-6 text-lg",
  };

  return (
    <div
      className={`rounded-lg shadow ${sizeClasses[size]}`}
      style={{
        backgroundColor: colorConfig[color].bg,
        color: colorConfig[color].text,
      }}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">{title}</h3>
        {icon && <div className="text-lg">{icon}</div>}
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      {trend && (
        <div className="flex items-center mt-1">
          <span className="text-xs">
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        </div>
      )}
    </div>
  );
};

export default DataCard;
