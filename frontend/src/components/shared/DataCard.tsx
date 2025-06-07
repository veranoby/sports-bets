import React from "react";

interface DataCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "dark";
}

export const DataCard: React.FC<DataCardProps> = ({
  title,
  children,
  className = "",
  variant = "default",
}) => {
  const variants = {
    default: "bg-white border-gray-100",
    dark: "bg-[#2a325c] border-[#596c95] text-white",
  };

  return (
    <div
      className={`rounded-xl p-4 shadow-sm border ${variants[variant]} ${className}`}
    >
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
};

export default DataCard;
