import React from "react";
import { Video, Settings, Mic, Play, StopCircle } from "lucide-react";
import Card from "../../components/shared/Card";

const OperatorStream: React.FC = () => {
  return (
    <div className="min-h-screen bg-theme-main text-theme-primary p-4">
      <h1 className="text-2xl font-bold mb-6">Control de Transmisión</h1>
      <Card className="bg-theme-card p-4">
        <div className="aspect-video bg-black rounded mb-4 flex items-center justify-center">
          <Video size={48} className="text-gray-600" />
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-1 px-4 py-2 bg-green-600 rounded">
            <Play size={16} /> Iniciar
          </button>
          <button className="flex items-center gap-1 px-4 py-2 bg-red-600 rounded">
            <StopCircle size={16} /> Detener
          </button>
          <button className="flex items-center gap-1 px-4 py-2 bg-theme-primary rounded">
            <Settings size={16} /> Configuración
          </button>
        </div>
      </Card>
    </div>
  );
};

export default OperatorStream;
