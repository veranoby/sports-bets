import React from "react";

interface DataCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  color?: "blue" | "red" | "green" | "gray";
}

const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = "blue",
}) => {
  const colorConfig = {
    blue: { bg: "#596c95", text: "white" },
    red: { bg: "#cd6263", text: "white" },
    green: { bg: "#10b981", text: "white" },
    gray: { bg: "#6b7280", text: "white" },
  };

  return (
    <div
      className="p-4 rounded-lg shadow"
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
