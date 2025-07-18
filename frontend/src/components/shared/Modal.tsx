import React, { useEffect } from "react";

interface ModalProps {
  title: string;
  isOpen?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

/**
 * Modal Component
 * Reusable modal dialog with consistent styling and behavior
 *
 * @param {string} title - Modal title
 * @param {boolean} [isOpen=true] - Controls modal visibility
 * @param {function} onClose - Close handler
 * @param {ReactNode} children - Modal content
 * @param {'sm'|'md'|'lg'|'xl'} [size='md'] - Modal size
 * @param {string} [className] - Additional classes
 * @param {boolean} [showCloseButton=true] - Show close button
 * @param {boolean} [closeOnOverlayClick=true] - Close when clicking outside
 */
const Modal: React.FC<ModalProps> = ({
  title,
  isOpen = true,
  onClose,
  children,
  size = "md",
  className = "",
  showCloseButton = true,
  closeOnOverlayClick = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div
        className="fixed inset-0"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      <div
        className={`bg-[#1a1f37] p-6 rounded-lg w-full ${sizeClasses[size]} ${className} relative z-10`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white text-2xl"
            >
              &times;
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
