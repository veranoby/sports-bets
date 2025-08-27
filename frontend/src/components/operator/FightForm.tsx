"use client";

import React from "react";
import { Save } from "lucide-react";
import { FormField } from "../shared/FormField";

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
        <FormField
          label="Criadero Rojo"
          value={fight.redBreeder}
          onChange={(value) =>
            onUpdate({ ...fight, redBreeder: String(value) })
          }
          required
        />
        <FormField
          label="Criadero Azul"
          value={fight.blueBreeder}
          onChange={(value) =>
            onUpdate({ ...fight, blueBreeder: String(value) })
          }
          required
        />
        <FormField
          label="Peso (libras)"
          value={fight.weight}
          onChange={(value) => onUpdate({ ...fight, weight: String(value) })}
          required
        />
      </div>

      <div className="mt-4">
        <FormField
          label="Observaciones"
          type="textarea"
          value={fight.notes}
          onChange={(value) => onUpdate({ ...fight, notes: String(value) })}
        />
      </div>
    </div>
  );
};

export default FightForm;
