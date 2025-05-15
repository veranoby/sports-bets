"use client";

import type React from "react";
import { Save } from "lucide-react";

interface FightDetails {
  id: string;
  redBreeder: string;
  blueBreeder: string;
  weight: string;
  notes: string;
}

interface FightFormProps {
  fight: FightDetails;
  onUpdate: (updatedFight: FightDetails) => void;
}

const FightForm: React.FC<FightFormProps> = ({ fight, onUpdate }) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    onUpdate({
      ...fight,
      [name]: value,
    });
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Detalles de la Pelea
        </h2>
        <button
          className="flex items-center bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
          onClick={() => console.log("Guardando cambios...")}
        >
          <Save className="w-4 h-4 mr-1.5" />
          Guardar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Criadero Rojo
          </label>
          <input
            type="text"
            name="redBreeder"
            value={fight.redBreeder}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Criadero Azul
          </label>
          <input
            type="text"
            name="blueBreeder"
            value={fight.blueBreeder}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Peso (libras)
          </label>
          <input
            type="text"
            name="weight"
            value={fight.weight}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observaciones
        </label>
        <textarea
          name="notes"
          value={fight.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default FightForm;
