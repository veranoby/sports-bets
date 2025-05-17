"use client";

import type React from "react";
import { useState } from "react";
import { X } from "lucide-react";

interface NewFightFormData {
  redBreeder: string;
  blueBreeder: string;
  weight: string;
  notes: string;
}

interface NewFightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFight: (fightData: NewFightFormData) => void;
}

const NewFightModal: React.FC<NewFightModalProps> = ({
  isOpen,
  onClose,
  onCreateFight,
}) => {
  const [formData, setFormData] = useState<NewFightFormData>({
    redBreeder: "",
    blueBreeder: "",
    weight: "",
    notes: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof NewFightFormData, string>>
  >({});

  // Si el modal no está abierto, no renderizamos nada
  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error cuando el usuario escribe
    if (errors[name as keyof NewFightFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NewFightFormData, string>> = {};

    if (!formData.redBreeder.trim()) {
      newErrors.redBreeder = "El criadero rojo es obligatorio";
    }

    if (!formData.blueBreeder.trim()) {
      newErrors.blueBreeder = "El criadero azul es obligatorio";
    }

    if (!formData.weight.trim()) {
      newErrors.weight = "El peso es obligatorio";
    } else if (isNaN(Number.parseFloat(formData.weight))) {
      newErrors.weight = "El peso debe ser un número válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onCreateFight(formData);
      // Resetear el formulario
      setFormData({
        redBreeder: "",
        blueBreeder: "",
        weight: "",
        notes: "",
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Nueva Pelea</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Criadero Rojo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="redBreeder"
                value={formData.redBreeder}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.redBreeder ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              />
              {errors.redBreeder && (
                <p className="mt-1 text-sm text-red-500">{errors.redBreeder}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Criadero Azul <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="blueBreeder"
                value={formData.blueBreeder}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.blueBreeder ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {errors.blueBreeder && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.blueBreeder}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (libras) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.weight ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent`}
              />
              {errors.weight && (
                <p className="mt-1 text-sm text-red-500">{errors.weight}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Crear Pelea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewFightModal;
