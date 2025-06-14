// Reemplazar TODO el contenido de frontend/src/pages/operator/Dashboard.tsx

import React, { useEffect, useState } from "react";
import { GitPullRequest, Award, Activity, Bell } from "lucide-react";
import LiveStats from "../../components/operator/LiveStats";
import StreamControls from "../../components/operator/StreamControls";
import { useEvents, useFights } from "../../hooks/useApi";
import { useWebSocket } from "../../hooks/useWebSocket";
import FightsList from "../../components/operator/FightsList";
import EventSelector from "../../components/operator/EventSelector";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import DataCard from "../../components/shared/DataCard";
import ErrorMessage from "../../components/shared/ErrorMessage";
import StatCard from "../../components/shared/StatCard";
import PageContainer from "../../components/shared/PageContainer";
import StatusIndicator from "../../components/shared/StatusIndicator";
import FightDetailModal from "../../components/operator/FightDetailModal";

const OperatorDashboard: React.FC = () => {
  const { events, loading: eventsLoading } = useEvents();
  const { fights, loading: fightsLoading, fetchFights, error } = useFights();

  // WebSocket listeners
  const wsListeners = {
    fight_updated: () => fetchFights(),
    betting_opened: () => fetchFights(),
    betting_closed: () => fetchFights(),
  };
  const { isConnected } = useWebSocket(undefined, wsListeners);

  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);
  const selectedFight = fights.find((f) => f.id === selectedFightId) || null;

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

  return (
    <PageContainer
      title="Panel de Operador"
      loading={eventsLoading || fightsLoading}
      error={error}
      onRetry={fetchFights}
      className="bg-[#1a1f37] text-white"
    >
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
        <StatCard
          title="Eventos Activos"
          value={activeEventsCount}
          change={{ value: 5, trend: "up", period: "hoy" }}
          color="blue"
          icon={<Activity className="w-5 h-5" />}
        />
        <DataCard
          title="Scheduled Fights"
          value={fights.filter((f) => f.status === "scheduled").length}
          color="red"
          icon={<GitPullRequest />}
        />
        <DataCard
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
