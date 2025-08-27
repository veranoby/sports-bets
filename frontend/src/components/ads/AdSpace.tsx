import React from "react";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";

interface AdSpaceProps {
  /** Unique identifier for the ad space */
  location: 
    | "header"
    | "sidebar"
    | "footer" 
    | "content-top"
    | "content-middle"
    | "content-bottom"
    | "article-top"
    | "article-bottom"
    | "dashboard-top"
    | "dashboard-bottom";
  
  /** Ad size configuration */
  size?: "small" | "medium" | "large" | "banner" | "square";
  
  /** Additional CSS classes */
  className?: string;
  
  /** Content to display when ads are disabled */
  fallbackContent?: React.ReactNode;
}

const AdSpace: React.FC<AdSpaceProps> = ({ 
  location, 
  size = "medium",
  className = "",
  fallbackContent 
}) => {
  const { isAdsEnabled } = useFeatureFlags();

  // Don't render anything if ads are disabled
  if (!isAdsEnabled) {
    return fallbackContent ? <>{fallbackContent}</> : null;
  }

  // Size configurations
  const sizeClasses = {
    small: "h-20 w-full max-w-sm",
    medium: "h-32 w-full max-w-md", 
    large: "h-48 w-full max-w-lg",
    banner: "h-24 w-full",
    square: "h-40 w-40"
  };

  // Location-specific styling
  const locationClasses = {
    header: "mb-4",
    sidebar: "mb-6",
    footer: "mt-4",
    "content-top": "mb-6",
    "content-middle": "my-6",
    "content-bottom": "mt-6", 
    "article-top": "mb-4",
    "article-bottom": "mt-4",
    "dashboard-top": "mb-6",
    "dashboard-bottom": "mt-6"
  };

  const containerClasses = `
    ${sizeClasses[size]}
    ${locationClasses[location]}
    ${className}
    bg-gray-100
    border-2
    border-dashed
    border-gray-300
    rounded-lg
    flex
    items-center
    justify-center
    text-gray-500
    text-sm
    font-medium
    transition-colors
    hover:bg-gray-50
    hover:border-gray-400
  `.trim().replace(/\s+/g, ' ');

  // Placeholder content for development
  const placeholderContent = (
    <div className="text-center px-4">
      <div className="mb-2">📢</div>
      <div>Ad Space</div>
      <div className="text-xs text-gray-400 mt-1">
        {location} · {size}
      </div>
    </div>
  );

  // In production, this would integrate with an ad service
  // For now, show placeholder
  return (
    <div 
      className={containerClasses}
      data-ad-location={location}
      data-ad-size={size}
    >
      {placeholderContent}
    </div>
  );
};

export default AdSpace;