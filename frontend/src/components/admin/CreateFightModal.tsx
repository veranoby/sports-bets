// frontend/src/components/admin/CreateFightModal.tsx
import React, { useState } from "react";
import { fightsAPI } from "../../services/api";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import { type Fight } from "../../types";

type FormErrors = {
  [key: string]: string;
};

interface CreateFightModalProps {
  eventId: string;
  onClose: () => void;
  onFightCreated: (newFight: Fight) => void;
}

const CreateFightModal: React.FC<CreateFightModalProps> = ({
  eventId,
  onClose,
  onFightCreated,
}) => {
  const [redCorner, setRedCorner] = useState("");
  const [blueCorner, setBlueCorner] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!redCorner)
      errors.redCorner = "El gallo del rincón rojo es obligatorio.";
    if (!blueCorner)
      errors.blueCorner = "El gallo del rincón azul es obligatorio.";
    if (redCorner === blueCorner && redCorner !== "") {
      errors.blueCorner = "El rincón azul debe ser distinto al rojo.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fightData = {
        eventId,
        redCorner,
        blueCorner,
        weight: weight ? parseFloat(weight) : undefined,
        notes,
      };
      const response = await fightsAPI.create(fightData);
      if (response.success && response.data) {
        onFightCreated(response.data as Fight);
      } else {
        throw new Error(response.error || "No se pudo crear la pelea");
      }
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado al crear la pelea.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Registrar nueva pelea</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            📌 El número de pelea se asignará automáticamente según el orden de
            creación
          </p>
          <div>
            <label
              htmlFor="redCorner"
              className="block text-sm font-medium text-gray-700"
            >
              Rincón rojo
            </label>
            <input
              type="text"
              id="redCorner"
              value={redCorner}
              onChange={(e) => setRedCorner(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border ${formErrors.redCorner ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {formErrors.redCorner && (
              <p className="text-xs text-red-500 mt-1">
                {formErrors.redCorner}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="blueCorner"
              className="block text-sm font-medium text-gray-700"
            >
              Rincón azul
            </label>
            <input
              type="text"
              id="blueCorner"
              value={blueCorner}
              onChange={(e) => setBlueCorner(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border ${formErrors.blueCorner ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {formErrors.blueCorner && (
              <p className="text-xs text-red-500 mt-1">
                {formErrors.blueCorner}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="weight"
              className="block text-sm font-medium text-gray-700"
            >
              Peso (kg)
            </label>
            <input
              type="number"
              step="0.01"
              id="weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border ${formErrors.weight ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {formErrors.weight && (
              <p className="text-xs text-red-500 mt-1">{formErrors.weight}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            ></textarea>
          </div>

          {error && <ErrorMessage error={error} />}

          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner text="Creando..." /> : "Crear pelea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFightModal;
