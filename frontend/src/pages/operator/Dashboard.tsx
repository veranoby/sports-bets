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
import TechnicalIssuesPanel from "../../components/operator/TechnicalIssuesPanel";

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

type ConfirmAction =
  | { type: "startTransmission" }
  | { type: "openBetting" }
  | { type: "closeBetting" }
  | { type: "recordResult"; payload: "red" | "draw" | "blue" };

const OperatorDashboard: React.FC = () => {
  // Estado para controlar si se muestra el selector de eventos o el panel principal
  const [activeEventId, setActiveEventId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeEventId");
    }
    return null;
  });
  const [isNewFightModalOpen, setIsNewFightModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );

  // Obtener el evento activo
  const activeEvent = activeEventId
    ? mockEvents.find((event) => event.id === activeEventId)
    : null;

  // Obtener las peleas del evento activo
  const [fightsByEvent, setFightsByEvent] =
    useState<Record<string, Fight[]>>(mockFights);
  const eventFights = React.useMemo(
    () => (activeEventId ? fightsByEvent[activeEventId] || [] : []),
    [activeEventId, fightsByEvent]
  );

  // Estado para la pelea actual
  const [currentFight, setCurrentFight] = useState<Fight | null>(null);

  // Persistencia de evento activo
  React.useEffect(() => {
    if (activeEventId) {
      localStorage.setItem("activeEventId", activeEventId);
    } else {
      localStorage.removeItem("activeEventId");
    }
  }, [activeEventId]);

  // Efecto para establecer la pelea actual cuando se activa un evento
  React.useEffect(() => {
    if (activeEventId && eventFights.length > 0) {
      const event = mockEvents.find((e) => e.id === activeEventId);
      if (event) {
        const fight = eventFights.find(
          (f) => f.number === event.currentFightNumber
        );
        if (fight) {
          setCurrentFight(fight);
        } else {
          const firstNonCompletedFight = eventFights.find(
            (f) => f.status !== "completed"
          );
          if (firstNonCompletedFight) {
            setCurrentFight(firstNonCompletedFight);
          } else {
            setCurrentFight(eventFights[eventFights.length - 1]);
          }
        }
      }
    } else {
      setCurrentFight(null);
    }
  }, [activeEventId, eventFights]);

  // Handler para activar un evento
  const handleActivateEvent = (eventId: string) => {
    setLoading(true);
    setTimeout(() => {
      setActiveEventId(eventId);
      setCurrentFight(null);
      setLoading(false);
      setErrorMsg("");
    }, 1000);
  };

  // Handler para crear una nueva pelea
  interface NewFightFormData {
    number: string;
    redBreeder: string;
    blueBreeder: string;
    weight: string;
    notes: string;
  }

  const handleCreateFight = (fightData: NewFightFormData) => {
    if (!activeEventId) return;
    const fights = fightsByEvent[activeEventId] || [];
    // Validar número único
    if (fights.some((f) => f.number === Number(fightData.number))) {
      setErrorMsg("Ya existe una pelea con ese número");
      return;
    }
    // Validar criaderos únicos en la pelea
    if (
      fights.some(
        (f) =>
          f.redBreeder.toLowerCase() === fightData.redBreeder.toLowerCase() &&
          f.blueBreeder.toLowerCase() === fightData.blueBreeder.toLowerCase()
      )
    ) {
      setErrorMsg("Ya existe una pelea con esos criaderos");
      return;
    }
    const newFight: Fight = {
      id: `fight-${Date.now()}`,
      number: Number(fightData.number),
      redBreeder: fightData.redBreeder,
      blueBreeder: fightData.blueBreeder,
      weight: fightData.weight,
      notes: fightData.notes,
      status: "upcoming",
    };
    setFightsByEvent((prev) => ({
      ...prev,
      [activeEventId]: [...fights, newFight],
    }));
    setErrorMsg("");
  };

  // Handlers para acciones críticas con confirmación
  const handleStartTransmission = () => {
    if (!currentFight) return;
    setConfirmAction({ type: "startTransmission" });
  };
  const handleOpenBetting = () => {
    if (!currentFight) return;
    setConfirmAction({ type: "openBetting" });
  };
  const handleCloseBetting = () => {
    if (!currentFight) return;
    setConfirmAction({ type: "closeBetting" });
  };
  const handleRecordResult = (result: "red" | "draw" | "blue") => {
    if (!currentFight) return;
    setConfirmAction({ type: "recordResult", payload: result });
  };

  // Ejecutar acción confirmada
  const executeConfirmedAction = () => {
    if (!currentFight || !confirmAction) return;
    switch (confirmAction.type) {
      case "startTransmission":
        updateFightStatus(currentFight.id, "live");
        break;
      case "openBetting":
        updateFightStatus(currentFight.id, "betting");
        break;
      case "closeBetting":
        updateFightStatus(currentFight.id, "live");
        break;
      case "recordResult":
        updateFightStatus(currentFight.id, "completed", confirmAction.payload);
        break;
    }
    setConfirmAction(null);
  };

  // Handler para actualizar detalles de la pelea
  const handleUpdateFight = (updatedFight: Partial<Fight>) => {
    if (!currentFight || !activeEventId) return;
    setCurrentFight({ ...currentFight, ...updatedFight });
    setFightsByEvent((prev) => ({
      ...prev,
      [activeEventId]: prev[activeEventId].map((f) =>
        f.id === currentFight.id ? { ...f, ...updatedFight } : f
      ),
    }));
  };

  // Handler para seleccionar pelea
  const handleSelectFight = (fightId: string) => {
    const selectedFight = eventFights.find((f) => f.id === fightId);
    if (selectedFight) {
      setCurrentFight(selectedFight);
    }
  };

  // Handler para editar pelea (no implementado)
  const handleEditFight = () => {
    // Aquí podrías abrir un modal de edición
  };

  // Handler para volver a selección de eventos
  const handleBackToEvents = () => {
    setLoading(true);
    setTimeout(() => {
      setActiveEventId(null);
      setCurrentFight(null);
      setErrorMsg("");
      setLoading(false);
    }, 500);
  };

  // Simulación de error de transmisión
  const simulateTransmissionError = () => {
    setErrorMsg("Error de transmisión. Intentando reconectar...");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setErrorMsg("");
    }, 2000);
  };

  // Actualizar pelea y lista de peleas correctamente en cada acción
  const updateFightStatus = (
    fightId: string,
    status: Fight["status"],
    result?: Fight["result"]
  ) => {
    if (!activeEventId) return;
    setFightsByEvent((prev) => ({
      ...prev,
      [activeEventId]: prev[activeEventId].map((f) =>
        f.id === fightId ? { ...f, status, ...(result ? { result } : {}) } : f
      ),
    }));
    if (currentFight && currentFight.id === fightId) {
      setCurrentFight((prev) =>
        prev ? { ...prev, status, ...(result ? { result } : {}) } : prev
      );
    }
  };

  // Optimización: evitar renders innecesarios
  const memoizedFights = React.useMemo(() => eventFights, [eventFights]);

  // Si está cargando
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-red-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <span className="text-gray-700 font-medium">Cargando evento...</span>
        </div>
      </div>
    );
  }

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
  if (memoizedFights.length === 0) {
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
          {errorMsg && (
            <div className="mb-2 text-red-600 text-sm">{errorMsg}</div>
          )}
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => setIsNewFightModalOpen(true)}
              className="w-full py-2 px-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Crear Nueva Pelea
            </button>
            <button
              onClick={handleBackToEvents}
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
                onClick={handleBackToEvents}
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
              fights={memoizedFights}
              type="upcoming"
              onSelectFight={handleSelectFight}
              onEditFight={handleEditFight}
            />
            <FightsList
              fights={memoizedFights}
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
                <button
                  className="mt-4 w-full bg-amber-50 text-amber-700 rounded-lg py-2 font-medium hover:bg-amber-100"
                  onClick={simulateTransmissionError}
                >
                  Simular Error de Transmisión
                </button>
                {errorMsg && (
                  <div className="mt-2 text-red-600 text-sm">{errorMsg}</div>
                )}
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
                <TechnicalIssuesPanel />
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
        onCreateFight={handleCreateFight}
        existingFightNumbers={memoizedFights.map((f) => f.number)}
      />
      {/* Modal de confirmación para acciones críticas */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-amber-500 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">
                Confirmar Acción
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              ¿Estás seguro de realizar esta acción crítica?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executeConfirmedAction}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorDashboard;
