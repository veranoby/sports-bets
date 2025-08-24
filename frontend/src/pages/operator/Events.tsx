import React from "react";
import { Calendar, Play, Clock } from "lucide-react";
import Card from "../../components/shared/Card";

const OperatorEvents: React.FC = () => {
  return (
    <div className="min-h-screen bg-theme-main text-theme-primary p-4">
      <h1 className="text-2xl font-bold mb-6">Eventos del Operador</h1>
      <div className="space-y-4">
        <Card className="bg-theme-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Evento de Prueba</h3>
              <p className="text-sm text-theme-secondary">Gallera Central</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>15:00 - 22:00</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OperatorEvents;
