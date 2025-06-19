// frontend/src/pages/user/Bets.tsx - VERSIÓN CORREGIDA
"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  TrendingUp,
  Clock,
  DollarSign,
  Award,
  Plus,
  Filter,
  ArrowLeft,
} from "lucide-react";

// ✅ SOLO IMPORTACIONES DE COMPONENTES EXISTENTES
import { useBets, useWallet } from "../../hooks/useApi";
import { useWebSocket } from "../../hooks/useWebSocket";
import BetCard from "../../components/user/BetCard";
import BettingPanel from "../../components/user/BettingPanel";
import CreateBetModal from "../../components/user/CreateBetModal";
import ProposalNotifications from "../../components/user/ProposalNotifications";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import DataCard from "../../components/shared/DataCard";

// ✅ TIPOS LOCALES PARA EVITAR DEPENDENCIAS EXTERNAS
type TabType = "my_bets" | "available" | "history" | "stats";

const UserBets: React.FC = () => {
  const navigate = useNavigate();

  // Estados principales
  const [activeTab, setActiveTab] = useState<TabType>("my_bets");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // API Hooks
  const { bets, loading, error, fetchMyBets, cancelBet, acceptBet } = useBets();

  const { wallet } = useWallet();

  // Estados para estadísticas calculadas localmente
  const [betStats, setBetStats] = useState({
    totalBets: 0,
    activeBets: 0,
    wonBets: 0,
    lostBets: 0,
    totalWon: 0,
    totalLost: 0,
    winRate: 0,
    netProfit: 0,
  });

  // WebSocket para actualizaciones
  const wsListeners = {
    bet_matched: () => fetchMyBets(),
    bet_result: () => fetchMyBets(),
    pago_proposed: () => fetchMyBets(),
  };

  const { isConnected } = useWebSocket(undefined, wsListeners);

  // Cargar datos al montar
  useEffect(() => {
    fetchMyBets();
  }, [fetchMyBets]);

  // Calcular estadísticas cuando cambien las apuestas
  useEffect(() => {
    if (bets.length > 0) {
      const stats = bets.reduce(
        (acc, bet) => {
          acc.totalBets++;
          if (bet.status === "active") acc.activeBets++;
          if (bet.result === "win") {
            acc.wonBets++;
            acc.totalWon += bet.potentialWin || 0;
          }
          if (bet.result === "loss") {
            acc.lostBets++;
            acc.totalLost += bet.amount;
          }
          return acc;
        },
        {
          totalBets: 0,
          activeBets: 0,
          wonBets: 0,
          lostBets: 0,
          totalWon: 0,
          totalLost: 0,
          winRate: 0,
          netProfit: 0,
        }
      );

      stats.winRate =
        stats.totalBets > 0 ? (stats.wonBets / stats.totalBets) * 100 : 0;
      stats.netProfit = stats.totalWon - stats.totalLost;
      setBetStats(stats);
    }
  }, [bets]);

  // Filtrar apuestas según estado
  const filteredBets = bets.filter((bet) => {
    if (filterStatus === "all") return true;
    return bet.status === filterStatus;
  });

  // Handlers
  const handleCancelBet = async (betId: string) => {
    try {
      await cancelBet(betId);
    } catch (error) {
      console.error("Error al cancelar apuesta:", error);
    }
  };

  const handleAcceptBet = async (betId: string) => {
    try {
      await acceptBet(betId);
    } catch (error) {
      console.error("Error al aceptar apuesta:", error);
    }
  };

  if (loading) return <LoadingSpinner text="Cargando apuestas..." />;

  return (
    <div className="bg-[#1a1f37] min-h-screen pb-20">
      {/* Header */}
      <header className="bg-[#2a325c] p-4 sticky top-0 z-10 border-b border-[#596c95]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-gray-300"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white">Mis Apuestas</h1>
          </div>
          <div className="flex items-center gap-2">
            <span
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

      {/* Estadísticas rápidas */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <DataCard
            title="Activas"
            value={betStats.activeBets}
            icon={<Activity />}
            color="blue"
          />
          <DataCard
            title="Ganadas"
            value={betStats.wonBets}
            icon={<Award />}
            color="green"
          />
          <DataCard
            title="% Victoria"
            value={`${betStats.winRate.toFixed(1)}%`}
            icon={<TrendingUp />}
            color="purple"
          />
          <DataCard
            title="Ganancia"
            value={`$${betStats.netProfit.toFixed(2)}`}
            icon={<DollarSign />}
            color={betStats.netProfit >= 0 ? "green" : "red"}
          />
        </div>
      </div>

      {/* Notificaciones de propuestas PAGO */}
      <div className="px-4 mb-4">
        <ProposalNotifications />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#596c95] bg-[#2a325c]">
        {[
          { key: "my_bets", label: "Mis Apuestas" },
          { key: "available", label: "Disponibles" },
          { key: "history", label: "Historial" },
          { key: "stats", label: "Panel" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`flex-1 py-3 font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-[#cd6263] text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de tabs */}
      <div className="p-4">
        {activeTab === "my_bets" && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex gap-2 mb-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#2a325c] text-white p-2 rounded border border-[#596c95]"
              >
                <option value="all">Todas</option>
                <option value="pending">Pendientes</option>
                <option value="active">Activas</option>
                <option value="settled">Finalizadas</option>
              </select>
            </div>

            {/* Lista de apuestas */}
            {filteredBets.length > 0 ? (
              filteredBets.map((bet) => (
                <BetCard
                  key={bet.id}
                  bet={bet}
                  onCancel={handleCancelBet}
                  onAccept={handleAcceptBet}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  No hay apuestas
                </h3>
                <p className="text-gray-400 mb-4">
                  {filterStatus === "all"
                    ? "Aún no has hecho ninguna apuesta"
                    : `No hay apuestas ${filterStatus}`}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "available" && (
          <div className="space-y-4">
            <p className="text-gray-300 text-center py-4">
              Ver apuestas disponibles en eventos en vivo
            </p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {bets
              .filter((bet) => bet.status === "settled")
              .map((bet) => (
                <BetCard
                  key={bet.id}
                  bet={bet}
                  onCancel={handleCancelBet}
                  onAccept={handleAcceptBet}
                  mode="history"
                />
              ))}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-4">
            <BettingPanel
              fightId="current-fight-id"
              mode="advanced"
              onBetPlaced={() => fetchMyBets()}
            />
          </div>
        )}
      </div>

      {/* Botón flotante para crear apuesta */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 bg-[#cd6263] text-white p-4 rounded-full shadow-lg hover:bg-[#b55456] transition-colors z-40"
      >
        <Plus size={24} />
      </button>

      {/* Modal para crear apuesta */}
      {showCreateModal && (
        <CreateBetModal
          fightId="current-fight-id"
          onClose={() => setShowCreateModal(false)}
          onBetCreated={() => {
            fetchMyBets();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default UserBets;
