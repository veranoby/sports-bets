import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Components
import EventList from "../../components/admin/events/EventList";
import EventDetail from "../../components/admin/events/EventDetail";
import SSEErrorBoundary from "../../components/admin/SSEErrorBoundary";

// APIs
import { eventsAPI } from "../../config/api";

type EventAction =
  | "schedule"
  | "activate"
  | "start-stream"
  | "stop-stream"
  | "complete"
  | "cancel";

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id: string }>();
  const [operationInProgress, setOperationInProgress] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleEventAction = async (
    targetEventId: string,
    action: EventAction,
  ): Promise<Event | undefined> => {
    try {
      setOperationInProgress(`${targetEventId}-${action}`);
      let response;
      switch (action) {
        case "schedule":
          response = await eventsAPI.updateStatus(targetEventId, "schedule");
          break;
        case "activate":
          response = await eventsAPI.updateStatus(targetEventId, "activate");
          break;
        case "start-stream":
          response = await eventsAPI.startStream(targetEventId);
          break;
        case "stop-stream":
          response = await eventsAPI.stopStream(targetEventId);
          break;
        case "complete":
          response = await eventsAPI.updateStatus(targetEventId, "complete");
          break;
        case "cancel":
          response = await eventsAPI.updateStatus(targetEventId, "cancel");
          break;
      }
      console.log("🔧 EventsPage response from API:", response);
      console.log(
        "🔧 Extracting event:",
        response?.data?.event || response?.data,
      );
      // Return updated event data for local state update
      return response?.data?.event || response?.data;
    } catch (err) {
      setError(
        `Error en ${action}: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
      throw err; // Re-throw so EventList can handle it
    } finally {
      setOperationInProgress(null);
    }
  };

  const handlePermanentDelete = async (eventId: string) => {
    try {
      setOperationInProgress(`${eventId}-delete`);
      await eventsAPI.permanentDelete(eventId);
      // Si estamos en EventDetail, navegar a lista
      if (eventId) {
        navigate("/admin/events");
      }
      // Si estamos en EventList, no hacer nada - EventList actualiza su propio estado
    } catch (err) {
      setError(
        `Error al eliminar: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
      throw err; // Re-throw para que EventList maneje el error
    } finally {
      setOperationInProgress(null);
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
          onPermanentDelete={handlePermanentDelete}
        />
      </SSEErrorBoundary>
    );
  }

  // Otherwise, show the list view
  return (
    <SSEErrorBoundary>
      <EventList
        onEventAction={handleEventAction}
        onPermanentDelete={handlePermanentDelete}
      />
    </SSEErrorBoundary>
  );
};

export default EventsPage;
