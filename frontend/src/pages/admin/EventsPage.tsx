import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { XCircle, CheckCircle, Video, Square } from "lucide-react";

// Components
import EventList from "../../components/admin/events/EventList";
import EventDetail from "../../components/admin/events/EventDetail";
import SSEErrorBoundary from "../../components/admin/SSEErrorBoundary";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";

// APIs
import { eventsAPI } from "../../config/api";

// Hooks
import { useAuth } from "../../contexts/AuthContext";

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [operationInProgress, setOperationInProgress] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleEventAction = async (eventId: string, action: string) => {
    let response = null; // Initialize response outside try block
    try {
      setOperationInProgress(`${eventId}-${action}`);
      switch (action) {
        case "activate":
          response = await eventsAPI.activate(eventId);
          break;
        case "start-stream":
          response = await eventsAPI.startStream(eventId);
          break;
        case "stop-stream":
          response = await eventsAPI.stopStream(eventId);
          break;
        case "complete":
          response = await eventsAPI.complete(eventId);
          break;
        case "cancel":
          response = await eventsAPI.updateStatus(eventId, "cancel");
          break;
      }
      if (response) {
        // In a real implementation, you would update local state here
        // For now, we'll just refresh the view by re-fetching
      }
    } catch (err) {
      setError(
        `Error en ${action}: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    } finally {
      setOperationInProgress(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres cancelar este evento? Esta acción cambiará el estado del evento a cancelado.",
      )
    ) {
      try {
        setOperationInProgress(`${eventId}-delete`);
        await eventsAPI.delete(eventId);

        // The EventDetail component will handle navigation when an event is deleted
      } catch (err) {
        setError(
          `Error al cancelar: ${err instanceof Error ? err.message : "Error desconocido"}`,
        );
      } finally {
        setOperationInProgress(null);
      }
    }
  };

  // If we have an event ID in the URL, show the detail view
  if (eventId) {
    return (
      <SSEErrorBoundary>
        <EventDetail
          eventId={eventId}
          onClose={() => navigate("/admin/events")}
          onEventAction={handleEventAction}
          onDeleteEvent={handleDeleteEvent}
        />
      </SSEErrorBoundary>
    );
  }

  // Otherwise, show the list view
  return (
    <SSEErrorBoundary>
      <EventList
        onEventAction={handleEventAction}
        onDeleteEvent={handleDeleteEvent}
      />
    </SSEErrorBoundary>
  );
};

export default EventsPage;