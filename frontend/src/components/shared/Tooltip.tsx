import React from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  delay = 0,
  className,
}) => {
  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      <div
        className={`absolute ${position} bg-gray-700 text-white text-xs rounded p-2`}
      >
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
