"use client";

import React from "react";
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
import EventSelector from "../../components/operator/EventSelector.tsx";
import NewFightModal from "../../components/operator/NewFightModal.tsx";

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

interface Event {
  id: string;
  name: string;
  venue: string;
  dateTime: string;
  status: "scheduled" | "in-progress" | "completed";
  totalFights: number;
  completedFights: number;
  currentFightNumber: number;
}

interface FightDetails {
  redBreeder: string;
  blueBreeder: string;
  weight: string;
  notes: string;
}

// Datos de ejemplo para eventos
const mockEvents: Event[] = [
  {
    id: "event-1",
    name: "Gallera El Palenque - Torneo Semanal",
    venue: "Gallera El Palenque, Ciudad de México",
    dateTime: new Date().toISOString(),
    status: "in-progress",
    totalFights: 12,
    completedFights: 2,
    currentFightNumber: 3,
  },
  {
    id: "event-2",
    name: "Arena San Juan - Campeonato Regional",
    venue: "Arena San Juan, Puerto Rico",
    dateTime: new Date(Date.now() + 86400000).toISOString(), // Mañana
    status: "scheduled",
    totalFights: 10,
    completedFights: 0,
    currentFightNumber: 1,
  },
  {
    id: "event-3",
    name: "Coliseo Nacional - Gran Final",
    venue: "Coliseo Nacional, Bogotá",
    dateTime: new Date(Date.now() - 86400000).toISOString(), // Ayer
    status: "completed",
    totalFights: 15,
    completedFights: 15,
    currentFightNumber: 15,
  },
  {
    id: "event-4",
    name: "Gallera La Victoria - Torneo Mensual",
    venue: "Gallera La Victoria, Lima",
    dateTime: new Date(Date.now() + 172800000).toISOString(), // Pasado mañana
    status: "scheduled",
    totalFights: 8,
    completedFights: 0,
    currentFightNumber: 1,
  },
];

// Datos de ejemplo para peleas
const mockFights: Record<string, Fight[]> = {
  "event-1": [
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
  ],
  "event-2": [
    {
      id: "fight-7",
      number: 1,
      redBreeder: "Criadero El Gallo Fino",
      blueBreeder: "Gallera Los Ases",
      weight: "4.4",
      notes: "Primera pelea del campeonato",
      status: "upcoming",
    },
    {
      id: "fight-8",
      number: 2,
      redBreeder: "Rancho El Dorado",
      blueBreeder: "Criadero San Miguel",
      weight: "4.6",
      notes: "",
      status: "upcoming",
    },
  ],
};

const OperatorDashboard: React.FC = () => {
  // Estado para controlar si se muestra el selector de eventos o el panel principal
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  // Estado para el modal de nueva pelea
  const [isNewFightModalOpen, setIsNewFightModalOpen] = useState(false);

  // Obtener el evento activo
  const activeEvent = activeEventId
    ? mockEvents.find((event) => event.id === activeEventId)
    : null;

  // Obtener las peleas del evento activo
  const eventFights = activeEventId ? mockFights[activeEventId] || [] : [];

  // Estado para la pelea actual
  const [currentFight, setCurrentFight] = useState<Fight | null>(null);

  // Efecto para establecer la pelea actual cuando se activa un evento
  React.useEffect(() => {
    if (activeEventId && eventFights.length > 0) {
      // Buscar la pelea actual según el número de pelea del evento
      const event = mockEvents.find((e) => e.id === activeEventId);
      if (event) {
        const fight = eventFights.find(
          (f) => f.number === event.currentFightNumber
        );
        if (fight) {
          setCurrentFight(fight);
        } else {
          // Si no se encuentra la pelea actual, usar la primera pelea no completada
          const firstNonCompletedFight = eventFights.find(
            (f) => f.status !== "completed"
          );
          if (firstNonCompletedFight) {
            setCurrentFight(firstNonCompletedFight);
          } else {
            // Si todas están completadas, usar la última
            setCurrentFight(eventFights[eventFights.length - 1]);
          }
        }
      }
    }
  }, [activeEventId, eventFights]);

  // Handler para activar un evento
  const handleActivateEvent = (eventId: string) => {
    setActiveEventId(eventId);
    const eventFights = mockFights[eventId] || [];
    if (eventFights.length > 0) {
      const event = mockEvents.find((e) => e.id === eventId);
      const currentFight =
        eventFights.find((f) => f.number === event?.currentFightNumber) ||
        eventFights[0];
      setCurrentFight(currentFight);
    }
  };

  // Handler para crear una nueva pelea
  const handleCreateFight = (fightData: {
    redBreeder: string;
    blueBreeder: string;
    weight: string;
    notes: string;
  }) => {
    console.log("Nueva pelea creada:", fightData);
    // Aquí se implementaría la lógica para añadir la pelea al evento activo
    // Para este ejemplo, simplemente mostramos un mensaje en la consola
  };

  // Handlers para acciones
  const handleStartTransmission = () => {
    if (!currentFight) return;

    console.log("Iniciando transmisión...");
    // Aquí actualizaríamos el estado de la pelea a "live"
    setCurrentFight({
      ...currentFight,
      status: "live",
    });
  };

  const handleOpenBetting = () => {
    if (!currentFight) return;

    console.log("Abriendo apuestas...");
    // Aquí actualizaríamos el estado de la pelea a "betting"
    setCurrentFight({
      ...currentFight,
      status: "betting",
    });
  };

  const handleCloseBetting = () => {
    if (!currentFight) return;

    console.log("Cerrando apuestas...");
    // Aquí mantendríamos el estado en "betting" pero deshabilitaríamos nuevas apuestas
    // Para simplificar, mantenemos el mismo estado
  };

  const handleRecordResult = (result: "red" | "draw" | "blue") => {
    if (!currentFight) return;

    console.log(`Registrando resultado: ${result}`);
    // Aquí actualizaríamos el estado de la pelea a "completed" y guardaríamos el resultado
    setCurrentFight({
      ...currentFight,
      status: "completed",
      result,
    });
  };

  const handleUpdateFight = (updatedFight: Partial<Fight>) => {
    if (!currentFight) return;

    console.log("Actualizando detalles de la pelea:", updatedFight);
    setCurrentFight({
      ...currentFight,
      ...updatedFight,
    });
  };

  const handleSelectFight = (fightId: string) => {
    const selectedFight = eventFights.find((f) => f.id === fightId);
    if (selectedFight) {
      console.log("Seleccionando pelea:", selectedFight);
      setCurrentFight(selectedFight);
    }
  };

  const handleEditFight = (fightId: string) => {
    console.log("Editando pelea:", fightId);
    // Aquí podríamos abrir un modal de edición o similar
  };

  // Si no hay evento activo, mostrar el selector de eventos
  if (!activeEventId || !activeEvent) {
    return (
      <EventSelector
        events={mockEvents}
        onActivateEvent={handleActivateEvent}
      />
    );
  }

  // Si no hay peleas en el evento activo
  if (eventFights.length === 0) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No hay peleas programadas
          </h2>
          <p className="text-gray-600 mb-6">
            Este evento no tiene peleas programadas. Puedes crear una nueva
            pelea o seleccionar otro evento.
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => setIsNewFightModalOpen(true)}
              className="w-full py-2 px-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Crear Nueva Pelea
            </button>
            <button
              onClick={() => setActiveEventId(null)}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Volver a Eventos
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <button
                onClick={() => setActiveEventId(null)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cambiar Evento
              </button>
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
            eventName={activeEvent.name}
            fightNumber={activeEvent.currentFightNumber}
            totalFights={activeEvent.totalFights}
          />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Fight Lists */}
          <div className="space-y-6">
            <FightsList
              fights={eventFights}
              type="upcoming"
              onSelectFight={handleSelectFight}
              onEditFight={handleEditFight}
            />

            <FightsList
              fights={eventFights}
              type="completed"
              onSelectFight={handleSelectFight}
            />

            <button
              className="w-full bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsNewFightModalOpen(true)}
            >
              <PlusCircle className="w-5 h-5 mr-2 text-gray-600" />
              Añadir Nueva Pelea
            </button>
          </div>

          {/* Middle Column - Live Preview and Actions */}
          <div className="space-y-6">
            {currentFight && (
              <>
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
              </>
            )}
          </div>

          {/* Right Column - Fight Details */}
          <div className="space-y-6">
            {currentFight && (
              <>
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
                      <h3 className="font-bold text-gray-900 mb-1">
                        Recordatorio
                      </h3>
                      <p className="text-sm text-gray-600">
                        Asegúrate de verificar el peso de los gallos antes de
                        iniciar la transmisión. Una vez que las apuestas estén
                        abiertas, no se podrán modificar los detalles de la
                        pelea.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
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

      {/* Modal para nueva pelea */}
      <NewFightModal
        isOpen={isNewFightModalOpen}
        onClose={() => setIsNewFightModalOpen(false)}
        onCreateFight={(data: FightDetails) => {
          handleCreateFight(data);
          setIsNewFightModalOpen(false);
        }}
      />
    </div>
  );
};

export default OperatorDashboard;
