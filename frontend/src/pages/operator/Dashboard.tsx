"use client";

import type React from "react";
import { useState } from "react";
import {
  Settings,
  LogOut,
  HelpCircle,
  AlertCircle,
  PlusCircle,
} from "lucide-react";

// Importación de componentes
import EventHeader from "../../components/operator/EventHeader";
import LivePreview from "../../components/operator/LivePreview";
import FightForm from "../../components/operator/FightForm";
import ActionButtons from "../../components/operator/ActionButtons";
import ResultRecorder from "../../components/operator/ResultRecorder";
import FightsList from "../../components/operator/FightsList";

// Tipos
interface Fight {
  id: string;
  number: number;
  redBreeder: string;
  blueBreeder: string;
  weight: string;
  notes: string;
  status: "upcoming" | "live" | "betting" | "completed";
  result?: "red" | "blue" | "draw";
}

// Datos de ejemplo
const mockData = {
  event: {
    id: "event-1",
    name: "Gallera El Palenque - Torneo Semanal",
    currentFightNumber: 3,
    totalFights: 12,
  },
  fights: [
    {
      id: "fight-1",
      number: 1,
      redBreeder: "Criadero Los Campeones",
      blueBreeder: "Gallera Imperial",
      weight: "4.5",
      notes: "Ambos gallos en excelente condición",
      status: "completed",
      result: "red",
    },
    {
      id: "fight-2",
      number: 2,
      redBreeder: "Rancho El Dorado",
      blueBreeder: "Granja San Pedro",
      weight: "4.2",
      notes: "Gallo azul ligeramente más joven",
      status: "completed",
      result: "blue",
    },
    {
      id: "fight-3",
      number: 3,
      redBreeder: "Criadero La Victoria",
      blueBreeder: "Gallera El Azteca",
      weight: "4.7",
      notes: "Pelea muy esperada entre campeones",
      status: "betting",
    },
    {
      id: "fight-4",
      number: 4,
      redBreeder: "Rancho Los Gallos",
      blueBreeder: "Criadero El Gallo de Oro",
      weight: "4.3",
      notes: "",
      status: "upcoming",
    },
    {
      id: "fight-5",
      number: 5,
      redBreeder: "Gallera Don José",
      blueBreeder: "Criadero El Campeón",
      weight: "4.6",
      notes: "",
      status: "upcoming",
    },
    {
      id: "fight-6",
      number: 6,
      redBreeder: "Rancho Las Plumas",
      blueBreeder: "Gallera El Espolón",
      weight: "4.4",
      notes: "",
      status: "upcoming",
    },
  ] as Fight[],
};

const OperatorDashboard: React.FC = () => {
  // Estado para la pelea actual
  const [currentFight, setCurrentFight] = useState<Fight>(
    mockData.fights.find(
      (f) => f.number === mockData.event.currentFightNumber
    ) || mockData.fights[0]
  );

  // Handlers para acciones
  const handleStartTransmission = () => {
    console.log("Iniciando transmisión...");
    // Aquí actualizaríamos el estado de la pelea a "live"
    setCurrentFight({
      ...currentFight,
      status: "live",
    });
  };

  const handleOpenBetting = () => {
    console.log("Abriendo apuestas...");
    // Aquí actualizaríamos el estado de la pelea a "betting"
    setCurrentFight({
      ...currentFight,
      status: "betting",
    });
  };

  const handleCloseBetting = () => {
    console.log("Cerrando apuestas...");
    // Aquí mantendríamos el estado en "betting" pero deshabilitaríamos nuevas apuestas
    // Para simplificar, mantenemos el mismo estado
  };

  const handleRecordResult = (result: "red" | "draw" | "blue") => {
    console.log(`Registrando resultado: ${result}`);
    // Aquí actualizaríamos el estado de la pelea a "completed" y guardaríamos el resultado
    setCurrentFight({
      ...currentFight,
      status: "completed",
      result,
    });
  };

  const handleUpdateFight = (updatedFight: Partial<Fight>) => {
    console.log("Actualizando detalles de la pelea:", updatedFight);
    setCurrentFight({
      ...currentFight,
      ...updatedFight,
    });
  };

  const handleSelectFight = (fightId: string) => {
    const selectedFight = mockData.fights.find((f) => f.id === fightId);
    if (selectedFight) {
      console.log("Seleccionando pelea:", selectedFight);
      setCurrentFight(selectedFight);
    }
  };

  const handleEditFight = (fightId: string) => {
    console.log("Editando pelea:", fightId);
    // Aquí podríamos abrir un modal de edición o similar
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-6">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Sports<span className="text-red-500">Bets</span>
                <span className="ml-2 text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  Panel de Operador
                </span>
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <HelpCircle className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Event Header */}
        <div className="mb-6">
          <EventHeader
            eventName={mockData.event.name}
            fightNumber={mockData.event.currentFightNumber}
            totalFights={mockData.event.totalFights}
          />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Fight Lists */}
          <div className="space-y-6">
            <FightsList
              fights={mockData.fights}
              type="upcoming"
              onSelectFight={handleSelectFight}
              onEditFight={handleEditFight}
            />

            <FightsList
              fights={mockData.fights}
              type="completed"
              onSelectFight={handleSelectFight}
            />

            <button className="w-full bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors">
              <PlusCircle className="w-5 h-5 mr-2 text-gray-600" />
              Añadir Nueva Pelea
            </button>
          </div>

          {/* Middle Column - Live Preview and Actions */}
          <div className="space-y-6">
            <LivePreview status={currentFight.status} />

            <ActionButtons
              fightStatus={currentFight.status}
              onStartTransmission={handleStartTransmission}
              onOpenBetting={handleOpenBetting}
              onCloseBetting={handleCloseBetting}
            />

            <ResultRecorder
              isActive={currentFight.status === "betting"}
              onRecordResult={handleRecordResult}
            />
          </div>

          {/* Right Column - Fight Details */}
          <div className="space-y-6">
            <FightForm
              fight={{
                id: currentFight.id,
                redBreeder: currentFight.redBreeder,
                blueBreeder: currentFight.blueBreeder,
                weight: currentFight.weight,
                notes: currentFight.notes,
              }}
              onUpdate={handleUpdateFight}
            />

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-amber-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Recordatorio</h3>
                  <p className="text-sm text-gray-600">
                    Asegúrate de verificar el peso de los gallos antes de
                    iniciar la transmisión. Una vez que las apuestas estén
                    abiertas, no se podrán modificar los detalles de la pelea.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="container mx-auto px-4 mt-6">
        <div className="flex justify-between items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">
            Operador:{" "}
            <span className="font-medium text-gray-900">Juan Pérez</span>
          </div>

          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
              Pausar Evento
            </button>
            <button className="px-4 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors">
              Anuncio de Emergencia
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Finalizar Evento
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OperatorDashboard;
