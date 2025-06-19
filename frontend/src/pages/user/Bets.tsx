// frontend/src/pages/user/Bets.tsx - VERSIÓN OPTIMIZADA
"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  TrendingUp,
  Clock,
  Target,
  DollarSign,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Hooks y servicios
import { useBets, useWallet } from "../../hooks/useApi";
import { useWebSocket } from "../../hooks/useWebSocket";

// Componentes
import BetCard from "../../components/user/BetCard";
import BettingPanel from "../../components/user/BettingPanel";
import BetHistoryTable from "../../components/user/BetHistoryTable";
import ProposalNotifications from "../../components/user/ProposalNotifications";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorBoundary from "../../components/shared/ErrorBoundary";
import EmptyState from "../../components/shared/EmptyState";
import DataCard from "../../components/shared/DataCard";

// Tipos
import type { Bet } from "../../types";

type TabType = "my_bets" | "available" | "history" | "stats";

const UserBets: React.FC = () => {
  const navigate = useNavigate();

  // Estados principales
  const [activeTab, setActiveTab] = useState<TabType>("my_bets");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);

  // API Hooks
  const {
    bets,
    loading,
    error,
    fetchMyBets,
    cancelBet,
    getBetsStats,
    getPendingProposals,
  } = useBets();

  const { wallet } = useWallet();

  // Estados para estadísticas
  const [betStats, setBetStats] = useState({
    totalBets: 0,
    activeBets: 0,
    wonBets: 0,
    lostBets: 0,
    totalWon: 0,
    totalLost: 0,
    winRate: 0,
    netProfit: 0,
    bestStreak: 0,
    currentStreak: 0,
  });

  const [pendingProposals, setPendingProposals] = useState<any[]>([]);

  // WebSocket para actualizaciones en tiempo real
  const wsListeners = {
    bet_matched: () => {
      fetchMyBets();
      loadStats();
    },
    bet_result: () => {
      fetchMyBets();
      loadStats();
    },
    pago_proposed: () => {
      loadPendingProposals();
    },
    pago_accepted: () => {
      fetchMyBets();
      loadPendingProposals();
    },
    pago_rejected: () => {
      loadPendingProposals();
    },
  };

  const { isConnected } = useWebSocket(undefined, wsListeners);

  // Cargar datos al montar
  useEffect(() => {
    fetchMyBets();
    loadStats();
    loadPendingProposals();
  }, []);

  // Funciones auxiliares
  const loadStats = async () => {
    try {
      const stats = await getBetsStats();
      setBetStats(stats);
    } catch (err) {
      console.error("Error loading bet stats:", err);
    }
  };

  const loadPendingProposals = async () => {
    try {
      const proposals = await getPendingProposals();
      setPendingProposals(proposals);
    } catch (err) {
      console.error("Error loading proposals:", err);
    }
  };

  const handleCancelBet = async (betId: string) => {
    try {
      await cancelBet(betId);
      // El hook ya actualiza el estado local
    } catch (err) {
      console.error("Error canceling bet:", err);
    }
  };

  // Filtros de apuestas
  const filteredBets = bets.filter((bet: Bet) => {
    if (filterStatus === "all") return true;
    return bet.status === filterStatus;
  });

  const activeBets = bets.filter((bet: Bet) =>
    ["pending", "active"].includes(bet.status)
  );

  // Configuración de pestañas
  const tabs = [
    {
      id: "my_bets" as TabType,
      label: "Mis Apuestas",
      icon: <Target size={18} />,
      badge: activeBets.length > 0 ? activeBets.length : undefined,
    },
    {
      id: "available" as TabType,
      label: "Disponibles",
      icon: <Activity size={18} />,
      badge: undefined,
    },
    {
      id: "history" as TabType,
      label: "Historial",
      icon: <Clock size={18} />,
      badge: undefined,
    },
    {
      id: "stats" as TabType,
      label: "Estadísticas",
      icon: <TrendingUp size={18} />,
      badge: undefined,
    },
  ];

  // Renderizado de contenido por tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "my_bets":
        return <MyBetsTab />;
      case "available":
        return <AvailableBetsTab />;
      case "history":
        return <HistoryTab />;
      case "stats":
        return <StatsTab />;
      default:
        return <MyBetsTab />;
    }
  };

  // Componentes de contenido para cada tab
  const MyBetsTab = () => (
    <div className="space-y-4">
      {/* Propuestas PAGO pendientes */}
      {pendingProposals.length > 0 && (
        <div className="bg-[#2a325c] p-4 rounded-lg border-l-4 border-yellow-500">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-yellow-500" />
            Propuestas PAGO Pendientes ({pendingProposals.length})
          </h3>
          <ProposalNotifications />
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "pending", "active", "completed", "cancelled"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                filterStatus === status
                  ? "bg-[#cd6263] text-white"
                  : "bg-[#2a325c] text-gray-300 hover:bg-[#596c95]"
              }`}
            >
              {status === "all"
                ? "Todas"
                : status === "pending"
                ? "Pendientes"
                : status === "active"
                ? "Activas"
                : status === "completed"
                ? "Completadas"
                : "Canceladas"}
            </button>
          )
        )}
      </div>

      {/* Lista de apuestas */}
      <div className="space-y-3">
        {filteredBets.length > 0 ? (
          filteredBets.map((bet: Bet) => (
            <BetCard
              key={bet.id}
              bet={bet}
              onCancel={() => handleCancelBet(bet.id)}
              onViewDetails={(id) => navigate(`/user/bets/${id}`)}
              showActions={["pending", "active"].includes(bet.status)}
            />
          ))
        ) : (
          <EmptyState
            title="No hay apuestas"
            description={
              filterStatus === "all"
                ? "Cuando hagas apuestas, aparecerán aquí"
                : `No hay apuestas ${
                    filterStatus === "pending" ? "pendientes" : filterStatus
                  }`
            }
            icon={<Target className="w-12 h-12 mx-auto text-gray-400" />}
            actionButton={
              <button
                onClick={() => setActiveTab("available")}
                className="mt-4 px-4 py-2 bg-[#cd6263] text-white rounded-lg hover:bg-[#b55555]"
              >
                Ver apuestas disponibles
              </button>
            }
          />
        )}
      </div>
    </div>
  );

  const AvailableBetsTab = () => (
    <div className="space-y-4">
      <div className="bg-[#2a325c] p-4 rounded-lg">
        <h3 className="text-white font-medium mb-3">
          Crear o Encontrar Apuestas
        </h3>
        <BettingPanel
          fightId={selectedFightId || "current-fight-id"}
          mode="advanced"
          onBetPlaced={() => {
            fetchMyBets();
            setActiveTab("my_bets");
          }}
        />
      </div>
    </div>
  );

  const HistoryTab = () => (
    <div className="space-y-4">
      <BetHistoryTable
        bets={bets.filter((bet: Bet) => bet.status === "completed")}
        loading={loading}
      />
    </div>
  );

  const StatsTab = () => (
    <div className="space-y-6">
      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DataCard
          title="Total Apuestas"
          value={betStats.totalBets.toString()}
          icon={<Activity />}
          color="blue"
        />
        <DataCard
          title="Tasa de Acierto"
          value={`${betStats.winRate.toFixed(1)}%`}
          icon={<Award />}
          color="green"
          trend={
            betStats.winRate > 50
              ? "up"
              : betStats.winRate < 50
              ? "down"
              : undefined
          }
        />
        <DataCard
          title="Ganancia Neta"
          value={`$${betStats.netProfit.toFixed(2)}`}
          icon={<DollarSign />}
          color={betStats.netProfit >= 0 ? "green" : "red"}
          trend={betStats.netProfit >= 0 ? "up" : "down"}
        />
        <DataCard
          title="Racha Actual"
          value={betStats.currentStreak.toString()}
          icon={<TrendingUp />}
          color="blue"
        />
      </div>

      {/* Estadísticas detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resumen de resultados */}
        <div className="bg-[#2a325c] p-6 rounded-lg">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <CheckCircle size={18} />
            Resumen de Resultados
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Apuestas ganadas:</span>
              <span className="text-green-400 font-medium">
                {betStats.wonBets}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Apuestas perdidas:</span>
              <span className="text-red-400 font-medium">
                {betStats.lostBets}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Apuestas activas:</span>
              <span className="text-blue-400 font-medium">
                {betStats.activeBets}
              </span>
            </div>
            <hr className="border-gray-600" />
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total ganado:</span>
              <span className="text-green-400 font-medium">
                ${betStats.totalWon.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total perdido:</span>
              <span className="text-red-400 font-medium">
                ${betStats.totalLost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Rendimiento */}
        <div className="bg-[#2a325c] p-6 rounded-lg">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <TrendingUp size={18} />
            Rendimiento
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Mejor racha:</span>
              <span className="text-green-400 font-medium">
                {betStats.bestStreak}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Racha actual:</span>
              <span
                className={`font-medium ${
                  betStats.currentStreak >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {betStats.currentStreak}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">ROI:</span>
              <span
                className={`font-medium ${
                  betStats.netProfit >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {betStats.totalLost > 0
                  ? ((betStats.netProfit / betStats.totalLost) * 100).toFixed(1)
                  : "0.0"}
                %
              </span>
            </div>
            <hr className="border-gray-600" />
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Apuesta promedio:</span>
              <span className="text-blue-400 font-medium">
                $
                {betStats.totalBets > 0
                  ? (
                      (betStats.totalWon + betStats.totalLost) /
                      betStats.totalBets
                    ).toFixed(2)
                  : "0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón para refrescar estadísticas */}
      <button
        onClick={loadStats}
        className="w-full bg-[#596c95] text-white py-3 rounded-lg hover:bg-[#4a5a85] transition-colors"
        disabled={loading}
      >
        {loading ? "Actualizando..." : "Actualizar Estadísticas"}
      </button>
    </div>
  );

  // Loading y Error states
  if (loading && bets.length === 0) {
    return <LoadingSpinner text="Cargando apuestas..." />;
  }

  if (error) {
    return <ErrorBoundary />;
  }

  return (
    <div className="bg-[#1a1f37] min-h-screen pb-20">
      {/* Header */}
      <header className="bg-[#2a325c] p-4 sticky top-0 z-10 border-b border-[#596c95]">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Gestión de Apuestas</h1>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-300">
              {isConnected ? "Conectado" : "Desconectado"}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-[#2a325c] border-b border-[#596c95]">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 py-4 px-4 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#cd6263] text-white bg-[#1a1f37]"
                  : "border-transparent text-gray-400 hover:text-gray-300 hover:bg-[#596c95]"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span className="bg-[#cd6263] text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">{renderTabContent()}</div>
    </div>
  );
};

export default UserBets;
