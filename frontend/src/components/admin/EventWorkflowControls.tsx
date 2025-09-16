// frontend/src/components/admin/EventWorkflowControls.tsx
// Event Workflow Controls - Uses new PATCH endpoints for event status transitions

import React, { useState } from 'react';
import {
  Play,
  CheckCircle,
  XCircle,
  Activity,
  AlertTriangle,
  Clock,
  Loader2
} from 'lucide-react';
import useSSE from '../../hooks/useSSE';

interface Event {
  id: string;
  name: string;
  scheduledDate: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  venueId: string;
  operatorId?: string;
  totalFights: number;
  completedFights: number;
  totalBets: number;
  totalPrizePool: number;
  streamUrl?: string;
  streamKey?: string;
  streamStatus?: "offline" | "live" | "error";
  venue?: {
    name: string;
    location: string;
  };
  operator?: {
    username: string;
    email: string;
  };
  creator?: {
    username: string;
  };
}

interface EventWorkflowControlsProps {
  event: Event;
  onEventUpdated: (updatedEvent: Event) => void;
  disabled?: boolean;
  className?: string;
}

const EventWorkflowControls: React.FC<EventWorkflowControlsProps> = ({
  event,
  onEventUpdated,
  disabled = false,
  className = ""
}) => {
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // SSE for real-time event updates
  const eventSSE = useSSE(`/api/sse/events/${event.id}/status`);

  // Handle SSE updates
  React.useEffect(() => {
    if (eventSSE.data && eventSSE.data.eventId === event.id) {
      const { status, streamUrl, streamKey } = eventSSE.data.data;
      onEventUpdated({
        ...event,
        status,
        streamUrl,
        streamKey
      });
    }
  }, [eventSSE.data, event, onEventUpdated]);

  // Handle event status actions using new PATCH endpoints
  const handleEventAction = async (action: 'activate' | 'complete' | 'cancel') => {
    try {
      setOperationInProgress(action);
      setError(null);

      // Use new PATCH endpoint
      const response = await fetch(`/api/events/${event.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} event`);
      }

      const result = await response.json();

      // Update event with response data
      if (result.success && result.data) {
        onEventUpdated({
          ...event,
          ...result.data.event,
          streamKey: result.data.streamKey,
          streamUrl: result.data.streamUrl
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error during ${action}`;
      setError(errorMessage);
      console.error(`Error during ${action}:`, err);
    } finally {
      setOperationInProgress(null);
    }
  };

  // Validate if transition is allowed
  const canActivate = event.status === "scheduled" && event.totalFights > 0;
  const canComplete = event.status === "in-progress";
  const canCancel = event.status !== "completed";

  const StatusBadge = ({ status }: { status: string }) => {
    const configs = {
      scheduled: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: Clock,
        label: "Programado"
      },
      "in-progress": {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: Activity,
        label: "En Progreso"
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "Completado"
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: XCircle,
        label: "Cancelado"
      }
    };

    const config = configs[status as keyof typeof configs] || configs.scheduled;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Control de Workflow</h3>
          <p className="text-sm text-gray-600">
            Gestiona las transiciones de estado del evento
          </p>
        </div>
        <StatusBadge status={event.status} />
      </div>

      {/* Transition Flow Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Programado</span>
          <span>En Progreso</span>
          <span>Completado</span>
        </div>
        <div className="flex items-center">
          <div className={`flex-1 h-2 rounded-l ${
            event.status === "scheduled" ? "bg-gray-300" : "bg-blue-500"
          }`}></div>
          <div className={`w-3 h-3 rounded-full border-2 ${
            event.status === "scheduled" ? "bg-gray-300 border-gray-400" :
            event.status === "in-progress" ? "bg-blue-500 border-blue-600" :
            "bg-green-500 border-green-600"
          }`}></div>
          <div className={`flex-1 h-2 ${
            event.status === "completed" ? "bg-green-500" :
            event.status === "in-progress" ? "bg-blue-500" : "bg-gray-300"
          }`}></div>
          <div className={`w-3 h-3 rounded-full border-2 ${
            event.status === "completed" ? "bg-green-500 border-green-600" :
            "bg-gray-300 border-gray-400"
          }`}></div>
          <div className={`flex-1 h-2 rounded-r ${
            event.status === "completed" ? "bg-green-500" : "bg-gray-300"
          }`}></div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Activate Button */}
        {canActivate && (
          <button
            onClick={() => handleEventAction('activate')}
            disabled={disabled || operationInProgress === 'activate' || !canActivate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {operationInProgress === 'activate' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {operationInProgress === 'activate' ? 'Activando...' : 'Activar Evento'}
          </button>
        )}

        {/* Complete Button */}
        {canComplete && (
          <button
            onClick={() => handleEventAction('complete')}
            disabled={disabled || operationInProgress === 'complete' || !canComplete}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {operationInProgress === 'complete' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {operationInProgress === 'complete' ? 'Finalizando...' : 'Finalizar Evento'}
          </button>
        )}

        {/* Cancel Button */}
        {canCancel && (
          <button
            onClick={() => handleEventAction('cancel')}
            disabled={disabled || operationInProgress === 'cancel' || !canCancel}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {operationInProgress === 'cancel' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {operationInProgress === 'cancel' ? 'Cancelando...' : 'Cancelar Evento'}
          </button>
        )}
      </div>

      {/* Stream Info */}
      {event.status === "in-progress" && event.streamUrl && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">Evento Activo</p>
          </div>
          <div className="text-xs text-blue-700">
            <p><strong>Stream URL:</strong> {event.streamUrl}</p>
            {event.streamKey && (
              <p><strong>Stream Key:</strong> {event.streamKey}</p>
            )}
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {event.status === "scheduled" && event.totalFights === 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              Se requiere al menos una pelea para activar el evento
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventWorkflowControls;