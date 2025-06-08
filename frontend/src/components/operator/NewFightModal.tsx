"use client";

import type React from "react";
import { useState } from "react";
import { X } from "lucide-react";
import Modal from "../shared/Modal";

interface NewFightFormData {
  number: string;
  redBreeder: string;
  blueBreeder: string;
  weight: string;
  notes: string;
}

interface NewFightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFight: (fightData: NewFightFormData) => void;
  existingFightNumbers?: number[];
}

const NewFightModal: React.FC<NewFightModalProps> = ({
  isOpen,
  onClose,
  onCreateFight,
  existingFightNumbers = [],
}) => {
  const [formData, setFormData] = useState<NewFightFormData>({
    number: "",
    redBreeder: "",
    blueBreeder: "",
    weight: "",
    notes: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof NewFightFormData, string>>
  >({});
  const [successMsg, setSuccessMsg] = useState<string>("");

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
    if (errors[name as keyof NewFightFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NewFightFormData, string>> = {};
    // Número de pelea
    if (!formData.number.trim()) {
      newErrors.number = "El número de pelea es obligatorio";
    } else if (!/^[1-9][0-9]*$/.test(formData.number.trim())) {
      newErrors.number = "Debe ser un número entero positivo";
    } else if (existingFightNumbers.includes(Number(formData.number.trim()))) {
      newErrors.number = "Ya existe una pelea con ese número";
    }
    // Criadero Rojo
    if (!formData.redBreeder.trim()) {
      newErrors.redBreeder = "El criadero rojo es obligatorio";
    }
    // Criadero Azul
    if (!formData.blueBreeder.trim()) {
      newErrors.blueBreeder = "El criadero azul es obligatorio";
    }
    // Nombres duplicados
    if (
      formData.redBreeder.trim() &&
      formData.blueBreeder.trim() &&
      formData.redBreeder.trim().toLowerCase() ===
        formData.blueBreeder.trim().toLowerCase()
    ) {
      newErrors.redBreeder = "Los criaderos no pueden ser iguales";
      newErrors.blueBreeder = "Los criaderos no pueden ser iguales";
    }
    // Peso
    if (!formData.weight.trim()) {
      newErrors.weight = "El peso es obligatorio";
    } else {
      const weightNum = Number.parseFloat(formData.weight);
      if (isNaN(weightNum)) {
        newErrors.weight = "El peso debe ser un número válido";
      } else if (weightNum < 1.0 || weightNum > 10.0) {
        newErrors.weight = "El peso debe estar entre 1.0 y 10.0";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    if (validateForm()) {
      onCreateFight(formData);
      setSuccessMsg("¡Pelea creada exitosamente!");
      setFormData({
        number: "",
        redBreeder: "",
        blueBreeder: "",
        weight: "",
        notes: "",
      });
      setErrors({});
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1200);
    }
  };

  return (
    <Modal title="New Fight" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de pelea <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="number"
              value={formData.number}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${
                errors.number ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent`}
              aria-invalid={!!errors.number}
              aria-describedby={errors.number ? "error-number" : undefined}
            />
            {errors.number && (
              <p id="error-number" className="mt-1 text-sm text-red-500">
                {errors.number}
              </p>
            )}
          </div>
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
              aria-invalid={!!errors.redBreeder}
              aria-describedby={
                errors.redBreeder ? "error-redBreeder" : undefined
              }
            />
            {errors.redBreeder && (
              <p id="error-redBreeder" className="mt-1 text-sm text-red-500">
                {errors.redBreeder}
              </p>
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
              aria-invalid={!!errors.blueBreeder}
              aria-describedby={
                errors.blueBreeder ? "error-blueBreeder" : undefined
              }
            />
            {errors.blueBreeder && (
              <p id="error-blueBreeder" className="mt-1 text-sm text-red-500">
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
              aria-invalid={!!errors.weight}
              aria-describedby={errors.weight ? "error-weight" : undefined}
            />
            {errors.weight && (
              <p id="error-weight" className="mt-1 text-sm text-red-500">
                {errors.weight}
              </p>
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
        {successMsg && (
          <div className="mt-4 bg-green-50 text-green-700 rounded-lg px-3 py-2 text-sm text-center">
            {successMsg}
          </div>
        )}
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
    </Modal>
  );
};

export default NewFightModal;
