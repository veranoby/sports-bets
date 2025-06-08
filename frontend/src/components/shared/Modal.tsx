import React from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-[#1a1f37] p-6 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
