// frontend/src/pages/operator/Dashboard.tsx
// 🔧 FIX: Error "joinRoom is not a function"

import React, { useState, useCallback, useEffect } from "react";
import { GitPullRequest, Award, Activity, Bell } from "lucide-react";
import LiveStats from "../../components/operator/LiveStats";
import StreamControls from "../../components/operator/StreamControls";
import { useEvents, useFights } from "../../hooks/useApi";
import { useWebSocket, useWebSocketEmit } from "../../hooks/useWebSocket";
import FightsList from "../../components/operator/FightsList";
import EventSelector from "../../components/operator/EventSelector";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Card from "../../components/shared/Card";
import ErrorMessage from "../../components/shared/ErrorMessage";

const OPERATOR_ROOM_ID = "operator_control_room";

const OperatorDashboard: React.FC = () => {
  const { events, loading: eventsLoading } = useEvents();
  const { fights, loading: fightsLoading, fetchFights, error } = useFights();

  // ✅ FIX: Move all callback declarations BEFORE useWebSocket to avoid hoisting errors
  const handleFightUpdated = useCallback(
    (data: { fightId: string }) => {
      console.log("Pelea actualizada:", data.fightId);
      fetchFights(); // Refrescar lista de peleas
    },
    [fetchFights]
  );

  const handleBettingOpened = useCallback((data: { fightId: string }) => {
    console.log("Apuestas abiertas para pelea:", data.fightId);
  }, []);

  const handleBettingClosed = useCallback((data: { fightId: string }) => {
    console.log("Apuestas cerradas para pelea:", data.fightId);
  }, []);

  // ✅ Now useWebSocket can safely reference the handlers
  const { isConnected } = useWebSocket(OPERATOR_ROOM_ID, {
    fight_updated: handleFightUpdated,
    betting_opened: handleBettingOpened,
    betting_closed: handleBettingClosed,
  });

  // ✅ Hook para emisión de eventos
  const { emit } = useWebSocketEmit();

  // ✅ Acciones del operador
  const openBetting = useCallback(
    (fightId: string) => {
      emit("operator:open_betting", { fightId });
    },
    [emit]
  );

  const closeBetting = useCallback(
    (fightId: string) => {
      emit("operator:close_betting", { fightId });
    },
    [emit]
  );

  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch inicial
  useEffect(() => {
    fetchFights();
  }, [fetchFights]);

  // Filtrado
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? event.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  if (eventsLoading) {
    return <LoadingSpinner text="Cargando eventos asignados..." />;
  }

  if (fightsLoading) {
    return <LoadingSpinner text="Cargando peleas..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={fetchFights} />;
  }

  return (
    <div className="min-h-screen bg-[#1a1f37] text-white p-4">
      {/* Selector de eventos */}
      <EventSelector
        events={filteredEvents}
        onActivateEvent={(id) => console.log("Activar evento:", id)}
      />

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card
          variant="stat"
          title="Eventos Activos"
          value={filteredEvents.length}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        <Card
          variant="stat"
          title="Peleas Pendientes"
          value={fights.filter((f) => f.status === "pending").length}
          icon={<GitPullRequest className="w-5 h-5" />}
          color="yellow"
        />
        <Card
          variant="stat"
          title="Peleas Completadas"
          value={fights.filter((f) => f.status === "completed").length}
          icon={<Award className="w-5 h-5" />}
          color="green"
        />
      </div>

      {/* Estado WebSocket */}
      <div className="mb-4 flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm">
          {isConnected ? "Conectado en tiempo real" : "Desconectado"}
        </span>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FightsList
            fights={fights}
            onOpenBetting={openBetting}
            onCloseBetting={closeBetting}
          />
        </div>
        <div className="space-y-4">
          <LiveStats />
          <StreamControls />
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
