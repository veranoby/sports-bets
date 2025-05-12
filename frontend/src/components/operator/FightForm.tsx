import React, { useState, useEffect } from "react";
import type { FC, ChangeEvent } from "react";

interface Fight {
  id: string;
  eventId: string;
  number: number;
  redCorner: string;
  blueCorner: string;
  weight: number;
  notes: string;
  status: "upcoming" | "betting" | "live" | "completed";
  result?: "red" | "blue" | "draw" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

interface FightFormProps {
  fight: Fight;
  onUpdate: (updatedFight: Fight) => void;
}

const FightForm: FC<FightFormProps> = ({ fight, onUpdate }) => {
  const [formData, setFormData] = useState<Fight>(fight);

  useEffect(() => {
    setFormData(fight);
  }, [fight]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const updatedData = {
      ...formData,
      [name]: name === "weight" ? parseFloat(value) || 0 : value,
    };

    setFormData(updatedData);
    onUpdate(updatedData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Detalles de la Pelea #{formData.number}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label
            htmlFor="redCorner"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Criadero Rojo
          </label>
          <input
            type="text"
            id="redCorner"
            name="redCorner"
            value={formData.redCorner}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <div>
          <label
            htmlFor="blueCorner"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Criadero Azul
          </label>
          <input
            type="text"
            id="blueCorner"
            name="blueCorner"
            value={formData.blueCorner}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <label
          htmlFor="weight"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Peso (lb)
        </label>
        <input
          type="number"
          id="weight"
          name="weight"
          value={formData.weight}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          step="0.01"
          min="0"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Observaciones
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
};

export default FightForm;
