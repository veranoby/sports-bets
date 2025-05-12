// src/pages/operator/Dashboard.tsx
import React, { useState, useEffect } from "react";
import EventHeader from "../../components/operator/EventHeader";
import LivePreview from "../../components/operator/LivePreview";
import FightForm from "../../components/operator/FightForm";
import ActionButtons from "../../components/operator/ActionButtons";
import ResultRecorder from "../../components/operator/ResultRecorder";
import FightsList from "../../components/operator/FightsList";

// Interfaces temporales (mover a tipos compartidos después)
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

interface Event {
  id: string;
  name: string;
  venue: string;
  date: Date;
  status: "scheduled" | "live" | "completed";
  totalFights: number;
}

const OperatorDashboard: React.FC = () => {
  // Estado para el ejemplo (en producción vendrá de context/API)
  const [isConnected, setIsConnected] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<Event>({
    id: "evt-123",
    name: "Torneo Regional Mayo 2025",
    venue: "Gallera Los Campeones",
    date: new Date(),
    status: "live",
    totalFights: 50,
  });

  const [currentFight, setCurrentFight] = useState<Fight>({
    id: "fgt-28",
    eventId: "evt-123",
    number: 28,
    redCorner: "El Furioso",
    blueCorner: "Campeón",
    weight: 4.5,
    notes: "",
    status: "betting",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [upcomingFights, setUpcomingFights] = useState<Fight[]>([
    // Datos de ejemplo
    {
      id: "fgt-29",
      eventId: "evt-123",
      number: 29,
      redCorner: "El Rápido",
      blueCorner: "Tornado",
      weight: 4.2,
      notes: "",
      status: "upcoming",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "fgt-30",
      eventId: "evt-123",
      number: 30,
      redCorner: "Relámpago",
      blueCorner: "Huracán",
      weight: 4.8,
      notes: "",
      status: "upcoming",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const [completedFights, setCompletedFights] = useState<Fight[]>([
    // Datos de ejemplo para peleas completadas
    {
      id: "fgt-27",
      eventId: "evt-123",
      number: 27,
      redCorner: "Campeón Jr",
      blueCorner: "El Terrible",
      weight: 4.6,
      notes: "",
      status: "completed",
      result: "red",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Acciones de ejemplo
  const handleUpdateFight = (fight: Partial<Fight>) => {
    setCurrentFight((prev) => ({ ...prev, ...fight, updatedAt: new Date() }));
  };

  const handleStartTransmission = () => {
    // Aquí iría la lógica para iniciar OBS
    setCurrentFight((prev) => ({
      ...prev,
      status: "live",
      updatedAt: new Date(),
    }));
  };

  const handleOpenBetting = () => {
    setCurrentFight((prev) => ({
      ...prev,
      status: "betting",
      updatedAt: new Date(),
    }));
  };

  const handleCloseBetting = () => {
    setCurrentFight((prev) => ({
      ...prev,
      status: "live",
      updatedAt: new Date(),
    }));
  };

  const handleRecordResult = (
    result: "red" | "blue" | "draw" | "cancelled"
  ) => {
    // En un caso real, esto enviaría los datos al servidor
    const updatedFight = {
      ...currentFight,
      status: "completed",
      result,
      updatedAt: new Date(),
    };

    // Actualizar la pelea actual
    setCurrentFight(updatedFight);

    // Mover a peleas completadas
    setCompletedFights((prev) => [updatedFight, ...prev]);

    // Si hay próximas peleas, establecer la siguiente como actual
    if (upcomingFights.length > 0) {
      const nextFight = upcomingFights[0];
      setCurrentFight(nextFight);
      setUpcomingFights((prev) => prev.slice(1));
    }
  };

  const handleCreateFight = () => {
    // Aquí iría un modal o formulario completo
    alert("Aquí se abriría el formulario para crear nueva pelea");
  };

  const handleFinishEvent = () => {
    if (window.confirm("¿Estás seguro de finalizar el evento?")) {
      setCurrentEvent((prev) => ({ ...prev, status: "completed" }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cabecera con logo e información general */}
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-4 py-2">
          <div className="flex items-center">
            <img
              src="/logo.svg"
              alt="Sports Bets"
              className="h-8 w-auto mr-3"
            />
            <span className="text-xl font-bold">PANEL DE OPERADOR</span>
          </div>
          <div className="flex items-center">
            <span
              className={`inline-block h-3 w-3 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            ></span>
            <span>{isConnected ? "Conectado" : "Desconectado"}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Encabezado del evento */}
        <EventHeader
          eventName={currentEvent.name}
          fightNumber={currentFight.number}
          totalFights={currentEvent.totalFights}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Vista previa de transmisión */}
          <div className="bg-white rounded-lg shadow p-4">
            <LivePreview status={currentFight.status} />
          </div>

          {/* Formulario de datos de pelea */}
          <div className="bg-white rounded-lg shadow p-4">
            <FightForm fight={currentFight} onUpdate={handleUpdateFight} />
          </div>

          {/* Botones de acción */}
          <div className="bg-white rounded-lg shadow p-4">
            <ActionButtons
              fightStatus={currentFight.status}
              onStartTransmission={handleStartTransmission}
              onOpenBetting={handleOpenBetting}
              onCloseBetting={handleCloseBetting}
            />
          </div>
        </div>

        {/* Registro de resultados */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <ResultRecorder
            isActive={currentFight.status === "live"}
            onRecordResult={handleRecordResult}
          />
        </div>

        {/* Listas de peleas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Próximas Peleas</h2>
            <FightsList fights={upcomingFights} type="upcoming" />
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Peleas Completadas</h2>
            <FightsList fights={completedFights} type="completed" />
          </div>
        </div>

        {/* Barra de acciones inferiores */}
        <div className="grid grid-cols-4 gap-4">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded">
            PROBLEMAS TÉCNICOS
          </button>
          <button
            onClick={handleCreateFight}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded"
          >
            CREAR PELEA
          </button>
          <button
            onClick={handleFinishEvent}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded"
          >
            FINALIZAR EVENTO
          </button>
          <button className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded">
            AYUDA RÁPIDA
          </button>
        </div>
      </main>
    </div>
  );
};

export default OperatorDashboard;
