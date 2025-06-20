// Reemplazar TODO el contenido de frontend/src/pages/operator/Dashboard.tsx

import React, { useState, useCallback } from "react";
import { GitPullRequest, Award, Activity, Bell } from "lucide-react";
import LiveStats from "../../components/operator/LiveStats";
import StreamControls from "../../components/operator/StreamControls";
import { useEvents, useFights } from "../../hooks/useApi";
import { useWebSocket } from "../../hooks/useWebSocket";
import FightsList from "../../components/operator/FightsList";
import EventSelector from "../../components/operator/EventSelector";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Card from "../../components/shared/Card";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PageContainer from "../../components/shared/PageContainer";
import StatusIndicator from "../../components/shared/StatusIndicator";
import FightDetailModal from "../../components/operator/FightDetailModal";
import SimplifiedPanel from "../../components/operator/SimplifiedPanel";

const OPERATOR_ROOM_ID = "operator_control_room";

const OperatorDashboard: React.FC = () => {
  const { events, loading: eventsLoading } = useEvents();
  const { fights, loading: fightsLoading, fetchFights, error } = useFights();

  // ✅ Hook especializado con listeners estables
  const { isConnected } = useWebSocket(OPERATOR_ROOM_ID, {
    new_bet: useCallback((data: any) => {
      console.log("Nueva apuesta creada:", data);
    }, []),
    bet_matched: useCallback((data: any) => {
      console.log("Apuesta emparejada:", data);
    }, []),
    fight_updated: useCallback((data: any) => {
      console.log("Pelea actualizada:", data);
    }, []),
    betting_opened: useCallback((data: any) => {
      console.log("Apuestas abiertas:", data);
    }, []),
    betting_closed: useCallback((data: any) => {
      console.log("Apuestas cerradas:", data);
    }, []),
    event_activated: useCallback((data: any) => {
      console.log("Evento activado:", data);
    }, []),
  });

  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);
  const selectedFight = fights.find((f) => f.id === selectedFightId) || null;

  const [useSimplifiedMode, setUseSimplifiedMode] = useState(
    () => localStorage.getItem("operatorSimplifiedMode") === "true"
  );

  const toggleSimplifiedMode = useCallback(() => {
    const newMode = !useSimplifiedMode;
    setUseSimplifiedMode(newMode);
    localStorage.setItem("operatorSimplifiedMode", newMode.toString());
  }, [useSimplifiedMode]);

  if (eventsLoading || fightsLoading) {
    return <LoadingSpinner text="Cargando panel de operador..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={fetchFights} />;
  }

  const activeEventsCount = events.length;

  if (useSimplifiedMode) {
    return <SimplifiedPanel />;
  }

  return (
    <PageContainer
      title="Panel de Operador"
      loading={eventsLoading || fightsLoading}
      error={error}
      onRetry={fetchFights}
      className="bg-[#1a1f37] text-white"
    >
      <div className="flex justify-between items-center mb-4">
        <h1>Panel de Operador</h1>
        <button
          onClick={toggleSimplifiedMode}
          className="bg-[#596c95] text-white px-4 py-2 rounded-lg hover:bg-[#4a5a85] transition-colors"
        >
          {useSimplifiedMode ? "Modo Completo" : "Modo Simplificado"}
        </button>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-5 h-5" />
        <StatusIndicator
          status={isConnected ? "connected" : "disconnected"}
          label={isConnected ? "Conectado" : "Desconectado"}
          size="sm"
        />
      </div>
      <EventSelector
        onActivateEvent={(id) => console.log(id)}
        onSearch={() => {}}
        onStatusFilter={() => {}}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card
          variant="stat"
          title="Eventos Activos"
          value={activeEventsCount}
          change={{ value: 5, trend: "up", period: "hoy" }}
          color="blue"
          icon={<Activity className="w-5 h-5" />}
        />
        <Card
          variant="data"
          title="Scheduled Fights"
          value={fights.filter((f) => f.status === "scheduled").length}
          color="red"
          icon={<GitPullRequest />}
        />
        <Card
          variant="data"
          title="Finished Fights"
          value={fights.filter((f) => f.status === "finished").length}
          color="green"
          icon={<Award />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <FightsList
            fights={fights}
            type="upcoming"
            onSelectFight={setSelectedFightId}
          />
          <FightsList
            fights={fights}
            type="completed"
            onSelectFight={setSelectedFightId}
          />
        </div>
        <div>
          <LiveStats />
          <StreamControls />
        </div>
      </div>

      {selectedFight && (
        <FightDetailModal
          fight={selectedFight}
          onClose={() => setSelectedFightId(null)}
        />
      )}
    </PageContainer>
  );
};

export default OperatorDashboard;
