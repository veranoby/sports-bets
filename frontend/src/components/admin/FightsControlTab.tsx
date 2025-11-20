import React, { useState } from "react";
import { Plus, Target } from "lucide-react";
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import CreateFightModal from "../../components/admin/CreateFightModal";
import FightStatusManager from "../../components/admin/FightStatusManager";
import { fightsAPI, eventsAPI } from "../../services/api";
import type { Fight } from "../../types";

interface FightsControlTabProps {
  eventId: string;
  eventDetailData: any;
  onFightsUpdate: (fights: Fight[]) => void;
  onEventUpdate: (event: any) => void;
}

const FightsControlTab: React.FC<FightsControlTabProps> = ({
  eventId,
  eventDetailData,
  onFightsUpdate,
  onEventUpdate,
}) => {
  const [isCreateFightModalOpen, setIsCreateFightModalOpen] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(
    null,
  );

  const handleFightCreated = (newFight: Fight) => {
    if (eventDetailData) {
      onFightsUpdate([...(eventDetailData.fights || []), newFight]);
    }
    setIsCreateFightModalOpen(false);
  };

  const handleFightUpdate = (updatedFight: Fight) => {
    if (eventDetailData) {
      const updatedFights = (eventDetailData.fights || []).map((f: Fight) =>
        f.id === updatedFight.id ? updatedFight : f,
      );
      onFightsUpdate(updatedFights);

      // Update event stats
      const updatedEvent = {
        ...eventDetailData.event,
        completedFights: updatedFights.filter(
          (f: Fight) => f.status === "completed",
        ).length,
        totalFights: updatedFights.length,
      };
      onEventUpdate(updatedEvent);
    }
  };

  const handleEventAction = async (action: string) => {
    setOperationInProgress(`event-${action}`);
    try {
      let response;
      switch (action) {
        case "start-stream":
          response = await eventsAPI.startStream(eventId);
          break;
        case "stop-stream":
          response = await eventsAPI.stopStream(eventId);
          break;
        default:
          break;
      }

      if (response && response.success) {
        // Update event data if needed
        onEventUpdate({ ...eventDetailData.event });
      }
    } catch (err) {
      console.error(`Error in ${action}:`, err);
    } finally {
      setOperationInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Control de Streaming
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Estado del Stream
              </label>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${
                    eventDetailData?.event?.streamStatus === "connected"
                      ? "bg-red-100 text-red-800 animate-pulse"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full mr-1 bg-current"></div>
                  {eventDetailData?.event?.streamStatus === "connected"
                    ? "Conectado"
                    : "Desconectado"}
                </span>
              </div>
            </div>

            {eventDetailData?.event?.liveStream?.url && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  URL del Stream
                </label>
                <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                  {eventDetailData.event.liveStream.url}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleEventAction("start-stream")}
                disabled={
                  eventDetailData?.event?.streamStatus === "connected" ||
                  operationInProgress?.includes("event-")
                }
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-white"></div>
                </div>
                Iniciar Stream
              </button>
              <button
                onClick={() => handleEventAction("stop-stream")}
                disabled={
                  eventDetailData?.event?.streamStatus !== "connected" ||
                  operationInProgress?.includes("event-")
                }
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
              >
                <div className="w-4 h-4 bg-white"></div>
                Detener Stream
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Estadísticas Técnicas
          </h3>
          <div className="space-y-3">
            {eventDetailData?.event?.currentViewers !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Espectadores
                </label>
                <p className="text-sm text-gray-900">
                  {eventDetailData.event.currentViewers}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Gestión de Peleas ({eventDetailData?.fights?.length || 0})
        </h3>
        <button
          onClick={() => setIsCreateFightModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Pelea
        </button>
      </div>

      <div className="space-y-4">
        {eventDetailData?.fights && eventDetailData.fights.length === 0 ? (
          <EmptyState
            title="Sin peleas programadas"
            description="Este evento aún no tiene peleas asignadas. Agrega peleas para comenzar con las apuestas."
            icon={<Target className="w-12 h-12" />}
            action={
              <button
                onClick={() => setIsCreateFightModalOpen(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primera Pelea
              </button>
            }
          />
        ) : (
          eventDetailData?.fights?.map((fight: Fight) => (
            <FightStatusManager
              key={fight.id}
              fight={fight}
              eventId={eventId}
              onFightUpdate={handleFightUpdate}
            />
          ))
        )}
      </div>

      {/* Modal de Crear Pelea */}
      {isCreateFightModalOpen && (
        <CreateFightModal
          eventId={eventId}
          onClose={() => setIsCreateFightModalOpen(false)}
          onFightCreated={handleFightCreated}
        />
      )}
    </div>
  );
};

export default FightsControlTab;
