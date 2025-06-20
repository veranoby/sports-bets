// frontend/src/components/operator/SimplifiedPanel.tsx
import React, { useState, useEffect } from "react";
import {
  Play,
  Square,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react";
import { useEvents, useFights } from "../../hooks/useApi";
import { useWebSocketContext } from "../../contexts/WebSocketContext";

const SimplifiedPanel: React.FC = () => {
  const { events, loading: eventsLoading } = useEvents();
  const {
    fights,
    loading: fightsLoading,
    updateFightStatus,
    recordFightResult,
  } = useFights();
  const { isConnected } = useWebSocketContext();

  const [currentFight, setCurrentFight] = useState<any>(null);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Encontrar pelea activa
  useEffect(() => {
    const activeFight = fights.find(
      (f) => f.status === "betting" || f.status === "live"
    );
    setCurrentFight(activeFight);

    if (activeFight) {
      const event = events.find((e) => e.id === activeFight.eventId);
      setCurrentEvent(event);
    }
  }, [fights, events]);

  const handleAction = async (
    action: string,
    fightId?: string,
    result?: string
  ) => {
    setActionLoading(action);
    try {
      switch (action) {
        case "open-betting":
          await updateFightStatus(fightId!, "betting");
          break;
        case "close-betting":
          await updateFightStatus(fightId!, "live");
          break;
        case "record-result":
          await recordFightResult(fightId!, result!);
          break;
      }
    } catch (error) {
      console.error("Action failed:", error);
      alert("Error: " + (error as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  if (eventsLoading || fightsLoading) {
    return (
      <div className="min-h-screen bg-[#1a1f37] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#cd6263] mx-auto mb-4"></div>
          <p className="text-xl">Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1f37] text-white p-4">
      {/* Header de Estado */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Panel Operador</h1>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <Wifi className="w-6 h-6 text-green-500" />
            ) : (
              <WifiOff className="w-6 h-6 text-red-500" />
            )}
            <span className="text-sm">
              {isConnected ? "Conectado" : "Sin conexión"}
            </span>
          </div>
        </div>

        {currentEvent && (
          <div className="bg-[#2a325c] rounded-lg p-4">
            <h2 className="text-xl font-semibold text-[#cd6263]">
              {currentEvent.name}
            </h2>
            <p className="text-gray-300">{currentEvent.venue?.name}</p>
          </div>
        )}
      </div>

      {/* Información Pelea Actual */}
      {currentFight ? (
        <div className="mb-8">
          <div className="bg-[#2a325c] border border-[#596c95] rounded-lg p-6 mb-6">
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-[#cd6263] mb-2">
                Pelea Actual
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-red-600 text-white p-4 rounded-lg">
                  <h4 className="font-bold text-lg">ROJO</h4>
                  <p className="text-sm">
                    {currentFight.redCorner?.breeder || "Criadero A"}
                  </p>
                </div>
                <div className="bg-blue-600 text-white p-4 rounded-lg">
                  <h4 className="font-bold text-lg">AZUL</h4>
                  <p className="text-sm">
                    {currentFight.blueCorner?.breeder || "Criadero B"}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mb-4">
              <span
                className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${
                  currentFight.status === "betting"
                    ? "bg-green-600"
                    : currentFight.status === "live"
                    ? "bg-yellow-600"
                    : "bg-gray-600"
                }`}
              >
                {currentFight.status === "betting"
                  ? "🟢 APUESTAS ABIERTAS"
                  : currentFight.status === "live"
                  ? "🟡 PELEA EN VIVO"
                  : "⚪ PREPARANDO"}
              </span>
            </div>
          </div>

          {/* Botones de Acción Grandes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {currentFight.status === "upcoming" && (
              <button
                onClick={() => handleAction("open-betting", currentFight.id)}
                disabled={actionLoading === "open-betting"}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-8 rounded-lg text-xl disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <Play className="w-8 h-8" />
                {actionLoading === "open-betting"
                  ? "Abriendo..."
                  : "ABRIR APUESTAS"}
              </button>
            )}

            {currentFight.status === "betting" && (
              <button
                onClick={() => handleAction("close-betting", currentFight.id)}
                disabled={actionLoading === "close-betting"}
                className="bg-[#cd6263] hover:bg-red-700 text-white font-bold py-6 px-8 rounded-lg text-xl disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <Square className="w-8 h-8" />
                {actionLoading === "close-betting"
                  ? "Cerrando..."
                  : "CERRAR APUESTAS"}
              </button>
            )}
          </div>

          {/* Botones de Resultado */}
          {currentFight.status === "live" && (
            <div>
              <h4 className="text-xl font-bold text-center mb-4 text-[#596c95]">
                REGISTRAR RESULTADO
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() =>
                    handleAction("record-result", currentFight.id, "red")
                  }
                  disabled={actionLoading === "record-result"}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-8 px-4 rounded-lg text-lg disabled:opacity-50 flex flex-col items-center justify-center gap-2"
                >
                  <CheckCircle className="w-12 h-12" />
                  GANA ROJO
                </button>

                <button
                  onClick={() =>
                    handleAction("record-result", currentFight.id, "draw")
                  }
                  disabled={actionLoading === "record-result"}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-8 px-4 rounded-lg text-lg disabled:opacity-50 flex flex-col items-center justify-center gap-2"
                >
                  <XCircle className="w-12 h-12" />
                  EMPATE
                </button>

                <button
                  onClick={() =>
                    handleAction("record-result", currentFight.id, "blue")
                  }
                  disabled={actionLoading === "record-result"}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-8 px-4 rounded-lg text-lg disabled:opacity-50 flex flex-col items-center justify-center gap-2"
                >
                  <CheckCircle className="w-12 h-12" />
                  GANA AZUL
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl text-gray-400">No hay peleas activas</h3>
          <p className="text-gray-500">Esperando la próxima pelea...</p>
        </div>
      )}

      {/* Información de Emergencia */}
      <div className="bg-yellow-600 text-black p-4 rounded-lg">
        <h4 className="font-bold mb-2">⚠️ CONTACTO EMERGENCIA</h4>
        <p>Soporte Técnico: +593-xxx-xxxx</p>
        <p>En caso de problemas, contactar inmediatamente</p>
      </div>
    </div>
  );
};

export default SimplifiedPanel;
