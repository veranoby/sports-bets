"use client";

import type React from "react";
import { useState } from "react";
import { X } from "lucide-react";
import Modal from "../shared/Modal";
import LoadingSpinner from "../shared/LoadingSpinner";
import FormField from "../shared/FormField";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
      setIsLoading(true);
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
        setIsLoading(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <Modal
      title="Nueva Pelea"
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        {
          label: "Cancelar",
          onClick: onClose,
          variant: "secondary",
        },
        {
          label: "Crear",
          onClick: handleSubmit,
          disabled: isLoading,
        },
      ]}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <FormField
          label="Nombre de la Pelea"
          value={formData.number}
          onChange={(e) => setFormData({ ...formData, number: e.target.value })}
          required
        />
      )}
    </Modal>
  );
};

export default NewFightModal;
