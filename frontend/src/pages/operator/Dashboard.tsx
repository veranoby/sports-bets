// Reemplazar TODO el contenido de frontend/src/pages/operator/Dashboard.tsx

import React, { useEffect, useState, useCallback } from "react";
import { GitPullRequest, Award, Activity, Bell } from "lucide-react";
import LiveStats from "../../components/operator/LiveStats";
import StreamControls from "../../components/operator/StreamControls";
import { useEvents, useFights } from "../../hooks/useApi";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import FightsList from "../../components/operator/FightsList";
import EventSelector from "../../components/operator/EventSelector";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Card from "../../components/shared/Card";
import ErrorMessage from "../../components/shared/ErrorMessage";
import PageContainer from "../../components/shared/PageContainer";
import StatusIndicator from "../../components/shared/StatusIndicator";
import FightDetailModal from "../../components/operator/FightDetailModal";
import SimplifiedPanel from "../../components/operator/SimplifiedPanel";

const OperatorDashboard: React.FC = () => {
  const { events, loading: eventsLoading } = useEvents();
  const { fights, loading: fightsLoading, fetchFights, error } = useFights();

  const { addListener, removeListener, isConnected, emit } =
    useWebSocketContext();

  const handleNewBet = useCallback((data) => {
    console.log("Nueva apuesta creada:", data);
  }, []);
  const handleBetMatched = useCallback((data) => {
    console.log("Apuesta emparejada:", data);
  }, []);
  const handleFightUpdated = useCallback((data) => {
    console.log("Pelea actualizada:", data);
  }, []);
  const handleBettingOpened = useCallback((data) => {
    console.log("Apuestas abiertas:", data);
  }, []);
  const handleBettingClosed = useCallback((data) => {
    console.log("Apuestas cerradas:", data);
  }, []);
  const handleEventActivated = useCallback((data) => {
    console.log("Evento activado:", data);
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    addListener("new_bet", handleNewBet);
    addListener("bet_matched", handleBetMatched);
    addListener("fight_updated", handleFightUpdated);
    addListener("betting_opened", handleBettingOpened);
    addListener("betting_closed", handleBettingClosed);
    addListener("event_activated", handleEventActivated);
    console.log("Listener agregado OperatorDashboard");
    return () => {
      removeListener("new_bet", handleNewBet);
      removeListener("bet_matched", handleBetMatched);
      removeListener("fight_updated", handleFightUpdated);
      removeListener("betting_opened", handleBettingOpened);
      removeListener("betting_closed", handleBettingClosed);
      removeListener("event_activated", handleEventActivated);
      console.log("Listener removido OperatorDashboard");
    };
  }, [isConnected]);

  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);
  const selectedFight = fights.find((f) => f.id === selectedFightId) || null;

  const [useSimplifiedMode, setUseSimplifiedMode] = useState(
    () => localStorage.getItem("operatorSimplifiedMode") === "true"
  );

  const toggleSimplifiedMode = () => {
    const newMode = !useSimplifiedMode;
    setUseSimplifiedMode(newMode);
    localStorage.setItem("operatorSimplifiedMode", newMode.toString());
  };

  useEffect(() => {
    fetchFights();
  }, []);

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
