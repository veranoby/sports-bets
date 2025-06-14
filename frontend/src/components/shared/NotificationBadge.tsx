import React from "react";

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  showZero?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "red" | "blue";
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  showZero = false,
  size = "md",
  color = "red",
}) => {
  if (count <= 0 && !showZero) return null;

  const sizeClasses = {
    sm: "text-xs w-4 h-4",
    md: "text-sm w-5 h-5",
    lg: "text-base w-6 h-6",
  };

  const colorClasses = {
    red: "bg-[#cd6263] text-white",
    blue: "bg-[#596c95] text-white",
  };

  const displayCount = count > maxCount ? `${maxCount}+` : count;

  return (
    <span
      className={`
      absolute -top-1 -right-1
      rounded-full flex items-center justify-center
      ${sizeClasses[size]} ${colorClasses[color]}
    `}
    >
      {displayCount}
    </span>
  );
};

export default NotificationBadge;
