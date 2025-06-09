// Reemplazar TODO el contenido de frontend/src/pages/operator/Dashboard.tsx

import React, { useState, useEffect } from "react";
import { List, GitPullRequest, Award, Activity, Video } from "lucide-react";
import FightManager from "../../components/operator/FightManager";
import ResultsPanel from "../../components/operator/ResultsPanel";
import LiveStats from "../../components/operator/LiveStats";
import StreamControls from "../../components/operator/StreamControls";
import LivePreview from "../../components/operator/LivePreview";
import { useEvents, useBets, useFights } from "../../hooks/useApi"; // ✅ CORRECTO
import { useWebSocket } from "../../hooks/useWebSocket"; // Comentado temporalmente
import FightsList from "../../components/operator/FightsList";
import EventSelector from "../../components/operator/EventSelector";
import ActionButtons from "../../components/operator/ActionButtons";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import DataCard from "../../components/shared/DataCard";

const OperatorDashboard: React.FC = () => {
  const { events, loading: eventsLoading } = useEvents();
  const {
    fights,
    loading: fightsLoading,
    fetchFights,
    loading,
    error,
  } = useFights();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Comentado temporalmente:
  // const socket = useWebSocket();

  useEffect(() => {
    fetchFights();
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? event.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  if (eventsLoading)
    return <LoadingSpinner text="Cargando eventos asignados..." />;
  if (fightsLoading) return <LoadingSpinner text="Cargando peleas..." />;
  if (error) return <div>Error loading fights: {error.message}</div>;

  return (
    <div className="min-h-screen bg-[#1a1f37] text-white p-4">
      <EventSelector
        events={events}
        onActivateEvent={(id) => console.log(id)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <DataCard
          title="Active Events"
          value={filteredEvents.length}
          color="blue"
          icon={<Activity />}
        />
        <DataCard
          title="Pending Fights"
          value={fights.filter((f) => f.status === "pending").length}
          color="red"
          icon={<GitPullRequest />}
        />
        <DataCard
          title="Completed Fights"
          value={fights.filter((f) => f.status === "completed").length}
          color="green"
          icon={<Award />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FightsList fights={fights} />
        </div>
        <div>
          <LiveStats />
          <StreamControls />
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
