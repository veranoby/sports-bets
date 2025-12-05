import React, { useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Drawer: React.FC<DrawerProps> = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Cerrar panel"
      />
      <aside
        className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-gray-100 flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            {title && (
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{title}</p>
            )}
            <h2 className="text-base font-semibold text-gray-900">Galleros.Net</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-6">{children}</div>
      </aside>
    </div>
  );
};

export default Drawer;
