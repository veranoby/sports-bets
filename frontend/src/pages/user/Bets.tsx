"use client";

import React, { useState } from "react";
import BetCard from "../../components/user/BetCard";
import { useBets } from "../../hooks/useApi";
import { useWebSocket } from "../../hooks/useWebSocket";
import BetHistoryTable from "../../components/user/BetHistoryTable";
import CreateBetModal from "../../components/user/CreateBetModal";
import { Plus } from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/shared/Tabs";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import FilterBar from "../../components/shared/FilterBar";
import StatusIndicator from "../../components/shared/StatusIndicator";
import BetDetailModal from "../../components/user/BetDetailModal";
import type { Bet } from "../../types";
import UserHeader from "../../components/user/UserHeader";
import {
  getUserThemeClasses,
  useUserTheme,
} from "../../contexts/UserThemeContext";

const UserBets = () => {
  const { bets, loading, error, fetchMyBets, fetchAvailableBets, cancelBet } =
    useBets();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const theme = getUserThemeClasses();
  const { updateColors } = useUserTheme();

  // TODO: Obtener fightId real del contexto de evento/pelea activa
  const activeFightId = bets.length > 0 ? bets[0].fightId : null;
  const wsListeners = {
    new_bet: () => activeFightId && fetchAvailableBets(activeFightId),
    bet_matched: () => fetchMyBets(),
  };
  const { isConnected } = useWebSocket(undefined, wsListeners);

  // Handler para Tabs que convierte el string a tipo correcto
  const handleTabChange = (value: string) => {
    if (value === "active" || value === "history") setActiveTab(value);
  };

  if (loading) return <LoadingSpinner text="Cargando apuestas..." />;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className={`${theme.pageBackground} pb-24`}>
      {/* Reemplazar header existente */}
      <UserHeader title="Mis Apuestas" />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList>
          <TabsTrigger value="active" className={theme.primaryButton}>
            Activas
          </TabsTrigger>
          <TabsTrigger value="history" className={theme.primaryButton}>
            Historial
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <div className="space-y-3">
            {bets.length > 0 ? (
              bets.map((bet) => (
                <BetCard
                  key={bet.id}
                  bet={bet}
                  onSelect={(b) => setSelectedBet(b)}
                />
              ))
            ) : (
              <EmptyState
                title="No tienes apuestas activas"
                description="Cuando hagas apuestas aparecerán aquí"
              />
            )}
          </div>
        </TabsContent>
        <TabsContent value="history">
          <div className="space-y-3">
            <BetHistoryTable bets={bets} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Buscar apuestas..."
        onSearch={() => {}}
        filters={[
          {
            key: "status",
            label: "Estado",
            type: "select",
            options: [
              { value: "pending", label: "Pendientes" },
              { value: "active", label: "Activas" },
              { value: "settled", label: "Liquidadas" },
              { value: "cancelled", label: "Canceladas" },
            ],
          },
        ]}
        onFilterChange={(key, value) =>
          setFilters({ ...filters, [key]: value })
        }
        className="mb-6"
      />

      <button
        onClick={() => setShowCreateModal(true)}
        className={`fixed bottom-6 right-6 ${theme.primaryButton} p-4 rounded-full shadow-lg`}
        disabled={!activeFightId}
        title={!activeFightId ? "No hay pelea activa para apostar" : ""}
      >
        <Plus />
      </button>
      {showCreateModal && activeFightId && (
        <CreateBetModal
          fightId={activeFightId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      {selectedBet && (
        <BetDetailModal
          bet={selectedBet}
          onClose={() => setSelectedBet(null)}
          onCancelBet={async (betId) => {
            await cancelBet(betId);
            setSelectedBet(null);
            fetchMyBets();
          }}
        />
      )}
    </div>
  );
};

export default UserBets;
