import React from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
    period: string;
  };
  icon?: React.ReactNode;
  color?: "blue" | "red" | "green" | "gray";
  className?: string;
}

const colorConfig = {
  blue: { bg: "bg-[#596c95]/10", text: "text-[#596c95]" },
  red: { bg: "bg-[#cd6263]/10", text: "text-[#cd6263]" },
  green: { bg: "bg-green-100", text: "text-green-600" },
  gray: { bg: "bg-gray-100", text: "text-gray-600" },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color = "blue",
  className = "",
}) => (
  <div className={`p-4 rounded-xl ${colorConfig[color].bg} ${className}`}>
    <div className="flex justify-between">
      <h3 className={`text-sm font-medium ${colorConfig[color].text}`}>
        {title}
      </h3>
      {icon && <div className={colorConfig[color].text}>{icon}</div>}
    </div>
    <p className="text-2xl font-bold mt-1">{value}</p>
    {change && (
      <div className="flex items-center mt-2 text-xs">
        {change.trend === "up" ? (
          <ArrowUp className="w-3 h-3 text-green-500 mr-1" />
        ) : change.trend === "down" ? (
          <ArrowDown className="w-3 h-3 text-red-500 mr-1" />
        ) : (
          <Minus className="w-3 h-3 text-gray-500 mr-1" />
        )}
        <span className="text-gray-500">
          {change.value}% {change.period}
        </span>
      </div>
    )}
  </div>
);

export default StatCard;
