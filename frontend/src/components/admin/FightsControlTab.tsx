import React, { useState } from "react";
import { Plus, Target, Trash2, Pencil } from "lucide-react";
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import CreateFightModal from "../../components/admin/CreateFightModal";
import EditFightModal from "../../components/admin/EditFightModal";
import FightStatusManager from "../../components/admin/FightStatusManager";
import { fightsAPI, eventsAPI } from "../../services/api";
import type { Fight } from "../../types";

interface FightsControlTabProps {
  eventId: string;
  eventDetailData: any;
  onFightsUpdate: (fights: Fight[]) => void;
  onEventUpdate: (event: any) => void;
  selectedFightId?: string | null; // Currently selected fight
  onFightSelect?: (fightId: string) => void; // Callback when a fight is selected
}

const FightsControlTab: React.FC<FightsControlTabProps> = ({
  eventId,
  eventDetailData,
  onFightsUpdate,
  onEventUpdate,
  selectedFightId,
  onFightSelect,
}) => {
  const [isCreateFightModalOpen, setIsCreateFightModalOpen] = useState(false);
  const [isEditFightModalOpen, setIsEditFightModalOpen] = useState(false);
  const [selectedFightForEdit, setSelectedFightForEdit] = useState<Fight | null>(null);
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
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">
          Peleas programadas ({eventDetailData?.fights?.length || 0})
        </h4>
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
            <div
              key={fight.id}
              className={`p-4 border rounded-lg transition-all ${
                selectedFightId === fight.id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onFightSelect && onFightSelect(fight.id)}
                >
                  <FightStatusManager
                    key={`${fight.id}-${fight.updatedAt}`}
                    fight={fight}
                    eventId={eventId}
                    onFightUpdate={handleFightUpdate}
                  />
                </div>
                <div className="flex space-x-1">
                  {/* Edit button - only show if fight status is "upcoming" */}
                  {fight.status === "upcoming" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFightForEdit(fight);
                        setIsEditFightModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      title="Editar pelea"
                      disabled={operationInProgress !== null}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {/* Delete button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          `⚠️ ¿Eliminar la pelea #${fight.number}? No se puede deshacer.`,
                        )
                      ) {
                        try {
                          setOperationInProgress(`${fight.id}-delete`);
                          await fightsAPI.delete(fight.id);
                          // Update local state
                          const updatedFights = (
                            eventDetailData?.fights || []
                          ).filter((f: Fight) => f.id !== fight.id);
                          onFightsUpdate(updatedFights);
                        } catch (err) {
                          console.error("Error deleting fight:", err);
                        } finally {
                          setOperationInProgress(null);
                        }
                      }
                    }}
                    className="ml-2 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar pelea"
                    disabled={operationInProgress !== null}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
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

      {/* Modal de Editar Pelea */}
      {isEditFightModalOpen && selectedFightForEdit && (
        <EditFightModal
          fight={selectedFightForEdit}
          onClose={() => setIsEditFightModalOpen(false)}
          onFightUpdated={handleFightUpdate}
        />
      )}
    </div>
  );
};

export default FightsControlTab;
