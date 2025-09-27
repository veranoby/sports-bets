// frontend/src/pages/user/Bets.tsx - VERSIÓN CORREGIDA
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navigate } from "react-router-dom"; // Added Navigate import
import { Activity, TrendingUp, DollarSign, Award, Plus } from "lucide-react";

// ✅ SOLO IMPORTACIONES DE COMPONENTES EXISTENTES
import { useBets, useWallet } from "../../hooks/useApi";

import BetCard from "../../components/user/BetCard";
import BettingPanel from "../../components/user/BettingPanel";
import CreateBetModal from "../../components/user/CreateBetModal";
import ProposalNotifications from "../../components/user/ProposalNotifications";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { useWebSocketListener } from "../../hooks/useWebSocket";
import { useFeatureFlags } from "../../hooks/useFeatureFlags"; // Added useFeatureFlags import

// ✅ TIPOS LOCALES PARA EVITAR DEPENDENCIAS EXTERNAS
type TabType = "my_bets" | "available" | "history" | "stats";

interface Bet {
  id: string;
  amount: number;
  status: string;
  result?: "win" | "loss";
  potentialWin?: number;
  userId?: string;
  updatedAt?: string;
  fightId: string;
  side: "red" | "blue";
  createdAt: string;
  odds?: number;
  createdBy?: string;
  choice?: string;
}

interface ProposalReceivedData {
  newProposal: Bet;
}

interface ProposalAcceptedData {
  proposalId: string;
}

interface ProposalRejectedData {
  proposalId: string;
}

interface BetProposalUpdateData {
  proposalId: string;
  updates: Partial<Bet>;
}

interface PagoProposedData {
  newBet: Bet;
}

const UserBets: React.FC = () => {
  const { isBettingEnabled } = useFeatureFlags(); // Added feature flag check

  // Estados principales
  const [activeTab, setActiveTab] = useState<TabType>("my_bets");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // API Hooks
  const { bets, loading, fetchMyBets, cancelBet, acceptBet } = useBets();

  // Use ref for bets to handle WebSocket updates
  const betsRef = useRef<Bet[]>([]);
  const setBetsRef = useRef<React.Dispatch<React.SetStateAction<Bet[]>>>(() => {});

  useWallet();

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

  // Update betsRef when bets change - properly cast BetData to Bet
  useEffect(() => {
    betsRef.current = bets.map(bet => ({
      ...bet,
      potentialWin: (bet as any).potentialWin || 0,
      userId: (bet as any).userId || '',
      updatedAt: (bet as any).updatedAt || new Date().toISOString(),
      result: (bet.result as "win" | "loss") || undefined,
      status: bet.status as any // Allow flexible status
    }));
  }, [bets]);

  // ✅ LISTENERS ESPECÍFICOS DE PROPUESTAS P2P
  const handleProposalReceived = useCallback((data: ProposalReceivedData) => {
    setBetsRef.current((prev) => [...prev, data.newProposal]);
  }, []);

  const handleProposalAccepted = useCallback((data: ProposalAcceptedData) => {
    setBetsRef.current((prev) =>
      prev.map((bet) =>
        bet.id === data.proposalId ? { ...bet, status: "accepted" } : bet,
      ),
    );
  }, []);

  const handleProposalRejected = useCallback((data: ProposalRejectedData) => {
    setBetsRef.current((prev) =>
      prev.filter((bet) => bet.id !== data.proposalId),
    );
  }, []);

  const handleBetProposalUpdate = useCallback((data: BetProposalUpdateData) => {
    setBetsRef.current((prev) =>
      prev.map((bet) =>
        bet.id === data.proposalId ? { ...bet, ...data.updates } : bet,
      ),
    );
  }, []);

  const handlePagoProposed = useCallback((data: PagoProposedData) => {
    setBetsRef.current((prev) => [...prev, data.newBet]);
  }, []);

  // ✅ MANTENER ESTOS (correctos):
  useWebSocketListener("proposal:received", handleProposalReceived);
  useWebSocketListener("proposal:accepted", handleProposalAccepted);
  useWebSocketListener("proposal:rejected", handleProposalRejected);
  useWebSocketListener("bet_proposal_update", handleBetProposalUpdate);
  useWebSocketListener("pago_proposed", handlePagoProposed);

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
            acc.totalWon += (bet as any).potentialWin || 0;
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
        },
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

  if (!isBettingEnabled) return <Navigate to="/dashboard" replace />; // Conditional rendering

  if (loading) return <LoadingSpinner text="Cargando apuestas..." />;

  return (
    <div className="bg-[#1a1f37] min-h-screen pb-20">
      {/* Estadísticas rápidas */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Tarjeta Activas */}
          <div className="bg-[#2a325c] p-4 rounded-lg border border-[#596c95]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Activas</p>
                <p className="text-xl font-bold text-white">
                  {betStats.activeBets}
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta Ganadas */}
          <div className="bg-[#2a325c] p-4 rounded-lg border border-[#596c95]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Award className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Ganadas</p>
                <p className="text-xl font-bold text-white">
                  {betStats.wonBets}
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta % Victoria */}
          <div className="bg-[#2a325c] p-4 rounded-lg border border-[#596c95]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">% Victoria</p>
                <p className="text-xl font-bold text-white">
                  {betStats.winRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta Ganancia */}
          <div className="bg-[#2a325c] p-4 rounded-lg border border-[#596c95]">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  betStats.netProfit >= 0 ? "bg-green-500/20" : "bg-red-500/20"
                }`}
              >
                <DollarSign
                  className={`w-5 h-5 ${
                    betStats.netProfit >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-400">Ganancia</p>
                <p
                  className={`text-xl font-bold ${
                    betStats.netProfit >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  ${betStats.netProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
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
                  bet={{
                    ...bet,
                    potentialWin: (bet as any).potentialWin || 0,
                    userId: (bet as any).userId || '',
                    updatedAt: (bet as any).updatedAt || new Date().toISOString(),
                    status: bet.status as any,
                    result: bet.result as any
                  } as any}
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
                  bet={{
                    ...bet,
                    potentialWin: (bet as any).potentialWin || 0,
                    userId: (bet as any).userId || '',
                    updatedAt: (bet as any).updatedAt || new Date().toISOString(),
                    status: bet.status as any,
                    result: bet.result as any
                  } as any}
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
          onClose={() => {
            fetchMyBets();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

//"TERMINANDO REFACTORING  del sistema por nueva logica de apuestas - ACTUALIZACION 1"

export default UserBets;